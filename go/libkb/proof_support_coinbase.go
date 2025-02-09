// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

package libkb

import (
	"regexp"
	"strings"

	keybase1 "github.com/keybase/client/go/protocol"
	jsonw "github.com/keybase/go-jsonw"
)

//=============================================================================
// Coinbase
//

type CoinbaseChecker struct {
	proof RemoteProofChainLink
}

func NewCoinbaseChecker(p RemoteProofChainLink) (*CoinbaseChecker, ProofError) {
	return &CoinbaseChecker{p}, nil
}

func (rc *CoinbaseChecker) ProfileURL() string {
	return "https://coinbase.com/" + rc.proof.GetRemoteUsername() + "/public-key"
}

func (rc *CoinbaseChecker) CheckHint(h SigHint) ProofError {
	wanted := rc.ProfileURL()
	if strings.ToLower(wanted) == strings.ToLower(h.apiURL) {
		return nil
	}
	return NewProofError(keybase1.ProofStatus_BAD_API_URL, "Bad hint from server; URL should be %q; got %q", wanted, h.apiURL)
}

func (rc *CoinbaseChecker) GetTorError() ProofError { return nil }

func (rc *CoinbaseChecker) CheckStatus(h SigHint) ProofError {
	res, err := G.XAPI.GetHTML(APIArg{
		Endpoint:    h.apiURL,
		NeedSession: false,
	})
	if err != nil {
		return XapiError(err, h.apiURL)
	}
	csssel := "div#public_key_content pre.statement"
	div := res.GoQuery.Find(csssel)
	if div.Length() == 0 {
		return NewProofError(keybase1.ProofStatus_FAILED_PARSE, "Couldn't find a div $(%s)", csssel)
	}

	// Only consider the first
	div = div.First()

	var ret ProofError

	if html, err := div.Html(); err != nil {
		ret = NewProofError(keybase1.ProofStatus_CONTENT_MISSING,
			"Missing proof HTML content: %s", err)
	} else if sigBody, _, err := OpenSig(rc.proof.GetArmoredSig()); err != nil {
		ret = NewProofError(keybase1.ProofStatus_BAD_SIGNATURE,
			"Bad signature: %s", err)
	} else if !FindBase64Block(html, sigBody, false) {
		ret = NewProofError(keybase1.ProofStatus_TEXT_NOT_FOUND, "signature not found in body")
	}

	return ret
}

//
//=============================================================================

type CoinbaseServiceType struct{ BaseServiceType }

func (t CoinbaseServiceType) AllStringKeys() []string     { return t.BaseAllStringKeys(t) }
func (t CoinbaseServiceType) PrimaryStringKeys() []string { return t.BasePrimaryStringKeys(t) }

func (t CoinbaseServiceType) CheckUsername(s string) (err error) {
	if !regexp.MustCompile(`^@?(?i:[a-z0-9_]{2,16})$`).MatchString(s) {
		err = BadUsernameError{s}
	}
	return
}

func (t CoinbaseServiceType) ToChecker() Checker {
	return t.BaseToChecker(t, "alphanumeric, between 2 and 16 characters")
}

func (t CoinbaseServiceType) GetPrompt() string {
	return "Your username on Coinbase"
}

func (t CoinbaseServiceType) ToServiceJSON(un string) *jsonw.Wrapper {
	return t.BaseToServiceJSON(t, un)
}

func (t CoinbaseServiceType) PostInstructions(un string) *Markup {
	return FmtMarkup(`Please update your Coinbase profile to show this proof.
Click here: https://coinbase.com/` + un + `/public-key`)

}

func (t CoinbaseServiceType) DisplayName(un string) string { return "Coinbase" }
func (t CoinbaseServiceType) GetTypeName() string          { return "coinbase" }

func (t CoinbaseServiceType) RecheckProofPosting(tryNumber int, status keybase1.ProofStatus, _ string) (warning *Markup, err error) {
	warning, err = t.BaseRecheckProofPosting(tryNumber, status)
	return
}
func (t CoinbaseServiceType) GetProofType() string { return t.BaseGetProofType(t) }

func (t CoinbaseServiceType) CheckProofText(text string, id keybase1.SigID, sig string) (err error) {
	return t.BaseCheckProofTextFull(text, id, sig)
}

//=============================================================================

func init() {
	RegisterServiceType(CoinbaseServiceType{})
	RegisterSocialNetwork("coinbase")
	RegisterProofCheckHook("coinbase",
		func(l RemoteProofChainLink) (ProofChecker, ProofError) {
			return NewCoinbaseChecker(l)
		})
}

//=============================================================================
