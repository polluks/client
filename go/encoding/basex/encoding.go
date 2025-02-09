// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

package basex

import (
	"bytes"
	"errors"
	"fmt"
	"math"
	"math/big"
)

const skipByte = byte(0xFF)
const invalidByte = byte(0xFE)

// Encoding is a radix X encoding/decoding scheme, defined by X-length
// character alphabet.
type Encoding struct {
	encode                 []byte
	decodeMap              [256]byte
	base256BlockLen        int
	baseXBlockLen          int
	base                   int
	logOfBase              float64
	baseBig                *big.Int
	maxEncodedBitsPerBlock int
	skipBytes              string
}

// NewEncoding returns a new Encoding defined by the given alphabet,
// which must a x-byte string. No padding options are currently allowed.
// inBlock is the size of input blocks to consider.
//
// For base 58, we recommend 19-byte
// input blocks, which encode to 26-byte output blocks with only .3 bits
// wasted per block. The name of the game is to find a good rational
// approximation of 8/log2(58), and 26/19 is pretty good!
func NewEncoding(encoder string, base256BlockLen int, skipBytes string) *Encoding {

	base := len(encoder)

	logOfBase := math.Log2(float64(base))

	// If input blocks are base256BlockLen size, compute the corresponding
	// output block length.  We need to round up to fit the overflow.
	baseXBlockLen := int(math.Ceil(float64(8*base256BlockLen) / logOfBase))

	// maxEncodedBitsPerBlock determines the maximum number of bits
	// we can fit into an encoded block of the given block length.
	// We're actually not going to be using this many bits, but we
	// need to know for the purposes of left shifting during encoding.
	maxEncodedBitsPerBlock := int(math.Floor(logOfBase * float64(baseXBlockLen)))

	// Code adapted from encoding/base64/base64.go in the standard
	// Go libraries.
	e := &Encoding{
		encode:                 make([]byte, base),
		base:                   base,
		base256BlockLen:        base256BlockLen,
		baseXBlockLen:          baseXBlockLen,
		logOfBase:              logOfBase,
		baseBig:                big.NewInt(int64(base)),
		maxEncodedBitsPerBlock: maxEncodedBitsPerBlock,
		skipBytes:              skipBytes,
	}
	copy(e.encode[:], encoder)

	var skipMap [256]bool
	for _, c := range skipBytes {
		skipMap[c] = true
	}

	for i := 0; i < len(e.decodeMap); i++ {
		val := invalidByte
		if skipMap[i] {
			val = skipByte
		}
		e.decodeMap[i] = val
	}
	for i := 0; i < len(encoder); i++ {
		e.decodeMap[encoder[i]] = byte(i)
	}
	return e
}

/*
 * Encoder
 */

// Encode encodes src using the encoding enc, writing
// EncodedLen(len(src)) bytes to dst.
//
// The encoding aligns the input along base256BlockLen boundaries.
// so Encode is not appropriate for use on individual blocks
// of a large data stream.  Use NewEncoder() instead.
func (enc *Encoding) Encode(dst, src []byte) {
	for sp, dp, sLim, dLim := 0, 0, 0, 0; sp < len(src); sp, dp = sLim, dLim {
		sLim = sp + enc.base256BlockLen
		dLim = dp + enc.baseXBlockLen
		if sLim > len(src) {
			sLim = len(src)
		}
		if dLim > len(dst) {
			dLim = len(dst)
		}
		enc.encodeBlock(dst[dp:dLim], src[sp:sLim])
	}
}

func (enc *Encoding) hasSkipBytes() bool {
	return len(enc.skipBytes) > 0
}

// IsValidByte returns true if the given byte is valid in this
// decoding. Can be either from the main alphabet or the skip
// alphabet to be considered valid.
func (enc *Encoding) IsValidByte(b byte) bool {
	return enc.decodeMap[b] != invalidByte
}

// extraBits returns the number of bits in the encoding that we'll need
// to shift over.
func (enc *Encoding) extraBits(decodedLen, encodedLen int) uint {
	var encodedBits int

	// The fast path is that we have a full block, so use the precomputed
	// value.
	if encodedLen == enc.baseXBlockLen {
		encodedBits = enc.maxEncodedBitsPerBlock
	} else {
		// The slow path means we have to compute the encodedBits
		// as a function of the input encoded block. It involves floating-point
		// operations so we try not to do it unless we have to.
		encodedBits = int(math.Floor(enc.logOfBase * float64(encodedLen)))
	}
	decodedBits := decodedLen * 8

	// This is the "fluff" that we need to shift over.
	return uint(encodedBits - decodedBits)
}

// encodeBlock fills the dst buffer with the encoding of src.
// It is assumed the buffers are appropriately sized, and no
// bounds checks are performed.  In particular, the dst buffer will
// be zero-padded from right to left in all remaining bytes.
func (enc *Encoding) encodeBlock(dst, src []byte) {

	// Interpret the block as a big-endian number (Go's default)
	num := new(big.Int).SetBytes(src)
	rem := new(big.Int)
	quo := new(big.Int)

	encodedLen := enc.EncodedLen(len(src))

	// Shift over the given number of extra Bits, so that all of our
	// wasted bits are on the right.
	num = num.Lsh(num, enc.extraBits(len(src), encodedLen))

	p := encodedLen - 1

	for num.Sign() != 0 {
		num, rem = quo.QuoRem(num, enc.baseBig, rem)
		dst[p] = enc.encode[rem.Uint64()]
		p--
	}

	// Pad the remainder of the buffer with 0s
	for p >= 0 {
		dst[p] = enc.encode[0]
		p--
	}
}

func (enc *Encoding) decode(dst []byte, src []byte) (n int, err error) {
	dp, sp := 0, 0
	for sp < len(src) {
		di, si, err := enc.decodeBlock(dst[dp:], src[sp:], sp)
		if err != nil {
			return 0, err
		}
		sp += si
		dp += di
	}
	return dp, nil
}

// Decode decodes src using the encoding enc.  It writes at most
// DecodedLen(len(src)) bytes to dst and returns the number of bytes
// written.  If src contains invalid baseX data, it will return the
// number of bytes successfully written and CorruptInputError.  It can
// also return an ErrInvalidEncodingLength error if there is a non-standard
// number of bytes in this encoding
func (enc *Encoding) Decode(dst, src []byte) (n int, err error) {
	return enc.decode(dst, src)
}

// CorruptInputError is returned when Decode() finds a non-alphabet character
type CorruptInputError int

// Error fits the error interface
func (e CorruptInputError) Error() string {
	return fmt.Sprintf("illegal data at input byte %d", int(e))
}

// ErrInvalidEncodingLength is returned when a non-minimal encoding length is found
var ErrInvalidEncodingLength = errors.New("invalid encoding length; either truncated or has trailing garbage")

func (enc *Encoding) decodeBlock(dst []byte, src []byte, baseOffset int) (int, int, error) {
	si := 0 // source index
	numGoodChars := 0
	res := new(big.Int)

	for i, b := range src {
		v := enc.decodeMap[b]
		si++

		if v == invalidByte {
			return 0, 0, CorruptInputError(i + baseOffset)
		}
		if v == skipByte {
			continue
		}

		numGoodChars++
		res.Mul(res, enc.baseBig)
		res.Add(res, big.NewInt(int64(v)))

		if numGoodChars == enc.baseXBlockLen {
			break
		}
	}

	if !enc.IsValidEncodingLength(numGoodChars) {
		return 0, 0, ErrInvalidEncodingLength
	}

	paddedLen := enc.DecodedLen(numGoodChars)

	// Compute the corresponding right shift, to move the number
	// over to its natural base.
	res = res.Rsh(res, enc.extraBits(paddedLen, numGoodChars))

	// Use big-endian representation (the default with Go's library)
	raw := res.Bytes()
	p := 0
	if len(raw) < paddedLen {
		p = paddedLen - len(raw)
		copy(dst, bytes.Repeat([]byte{0}, p))
	}
	copy(dst[p:paddedLen], raw)
	return paddedLen, si, nil
}

// EncodedLen returns the length in bytes of the baseX encoding
// of an input buffer of length n
func (enc *Encoding) EncodedLen(n int) int {

	// Fast path!
	if n == enc.base256BlockLen {
		return enc.baseXBlockLen
	}

	nblocks := n / enc.base256BlockLen
	out := nblocks * enc.baseXBlockLen
	rem := n % enc.base256BlockLen
	if rem > 0 {
		out += int(math.Ceil(float64(rem*8) / enc.logOfBase))
	}
	return out
}

// DecodedLen returns the length in bytes of the baseX decoding
// of an input buffer of length n
func (enc *Encoding) DecodedLen(n int) int {

	// Fast path!
	if n == enc.baseXBlockLen {
		return enc.base256BlockLen
	}

	nblocks := n / enc.baseXBlockLen
	out := nblocks * enc.base256BlockLen
	rem := n % enc.baseXBlockLen
	if rem > 0 {
		out += int(math.Floor(float64(rem) * enc.logOfBase / float64(8)))
	}
	return out
}

// IsValidEncodingLength returns true if this block has a valid encoding length.
// An encoding length is invalid if a short encoding would have sufficed.
func (enc *Encoding) IsValidEncodingLength(n int) bool {
	// Fast path!
	if n == enc.baseXBlockLen {
		return true
	}
	f := func(n int) int {
		return int(math.Floor(float64(n) * enc.logOfBase / float64(8)))
	}
	if f(n) == f(n-1) {
		return false
	}
	return true
}
