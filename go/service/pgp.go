// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

package service

import (
	"github.com/keybase/client/go/engine"
	"github.com/keybase/client/go/libkb"
	keybase1 "github.com/keybase/client/go/protocol"
	rpc "github.com/keybase/go-framed-msgpack-rpc"
	"golang.org/x/net/context"
)

type PGPHandler struct {
	*BaseHandler
	libkb.Contextified
}

func NewPGPHandler(xp rpc.Transporter, g *libkb.GlobalContext) *PGPHandler {
	return &PGPHandler{
		BaseHandler:  NewBaseHandler(xp),
		Contextified: libkb.NewContextified(g),
	}
}

func (h *PGPHandler) PGPSign(_ context.Context, arg keybase1.PGPSignArg) (err error) {
	cli := h.getStreamUICli()
	src := libkb.NewRemoteStreamBuffered(arg.Source, cli, arg.SessionID)
	snk := libkb.NewRemoteStreamBuffered(arg.Sink, cli, arg.SessionID)
	earg := engine.PGPSignArg{Sink: snk, Source: src, Opts: arg.Opts}
	ctx := engine.Context{SecretUI: h.getSecretUI(arg.SessionID)}
	eng := engine.NewPGPSignEngine(&earg, h.G())
	return engine.RunEngine(eng, &ctx)
}

func (h *PGPHandler) PGPPull(_ context.Context, arg keybase1.PGPPullArg) error {
	earg := engine.PGPPullEngineArg{
		UserAsserts: arg.UserAsserts,
	}
	ctx := engine.Context{
		LogUI:      h.getLogUI(arg.SessionID),
		IdentifyUI: h.NewRemoteIdentifyUI(arg.SessionID, h.G()),
	}
	eng := engine.NewPGPPullEngine(&earg, h.G())
	return engine.RunEngine(eng, &ctx)
}

func (h *PGPHandler) PGPEncrypt(_ context.Context, arg keybase1.PGPEncryptArg) error {
	cli := h.getStreamUICli()
	src := libkb.NewRemoteStreamBuffered(arg.Source, cli, arg.SessionID)
	snk := libkb.NewRemoteStreamBuffered(arg.Sink, cli, arg.SessionID)
	earg := &engine.PGPEncryptArg{
		Recips:       arg.Opts.Recipients,
		Sink:         snk,
		Source:       src,
		NoSign:       arg.Opts.NoSign,
		NoSelf:       arg.Opts.NoSelf,
		BinaryOutput: arg.Opts.BinaryOut,
		KeyQuery:     arg.Opts.KeyQuery,
		TrackOptions: arg.Opts.TrackOptions,
	}
	ctx := &engine.Context{
		IdentifyUI: h.NewRemoteIdentifyUI(arg.SessionID, h.G()),
		SecretUI:   h.getSecretUI(arg.SessionID),
	}
	eng := engine.NewPGPEncrypt(earg, h.G())
	return engine.RunEngine(eng, ctx)
}

func (h *PGPHandler) PGPDecrypt(_ context.Context, arg keybase1.PGPDecryptArg) (keybase1.PGPSigVerification, error) {
	cli := h.getStreamUICli()
	src := libkb.NewRemoteStreamBuffered(arg.Source, cli, arg.SessionID)
	snk := libkb.NewRemoteStreamBuffered(arg.Sink, cli, arg.SessionID)
	earg := &engine.PGPDecryptArg{
		Sink:         snk,
		Source:       src,
		AssertSigned: arg.Opts.AssertSigned,
		SignedBy:     arg.Opts.SignedBy,
		TrackOptions: arg.Opts.TrackOptions,
	}
	ctx := &engine.Context{
		SecretUI:   h.getSecretUI(arg.SessionID),
		IdentifyUI: h.NewRemoteSkipPromptIdentifyUI(arg.SessionID, h.G()),
		LogUI:      h.getLogUI(arg.SessionID),
	}
	eng := engine.NewPGPDecrypt(earg, h.G())
	err := engine.RunEngine(eng, ctx)
	if err != nil {
		return keybase1.PGPSigVerification{}, err
	}

	return sigVer(eng.SignatureStatus(), eng.Owner()), nil
}

func (h *PGPHandler) PGPVerify(_ context.Context, arg keybase1.PGPVerifyArg) (keybase1.PGPSigVerification, error) {
	cli := h.getStreamUICli()
	src := libkb.NewRemoteStreamBuffered(arg.Source, cli, arg.SessionID)
	earg := &engine.PGPVerifyArg{
		Source:       src,
		Signature:    arg.Opts.Signature,
		SignedBy:     arg.Opts.SignedBy,
		TrackOptions: arg.Opts.TrackOptions,
	}
	ctx := &engine.Context{
		SecretUI:   h.getSecretUI(arg.SessionID),
		IdentifyUI: h.NewRemoteIdentifyUI(arg.SessionID, h.G()),
		LogUI:      h.getLogUI(arg.SessionID),
	}
	eng := engine.NewPGPVerify(earg, h.G())
	err := engine.RunEngine(eng, ctx)
	if err != nil {
		return keybase1.PGPSigVerification{}, err
	}

	return sigVer(eng.SignatureStatus(), eng.Owner()), nil
}

func sigVer(ss *libkb.SignatureStatus, owner *libkb.User) keybase1.PGPSigVerification {
	var res keybase1.PGPSigVerification
	if ss.IsSigned {
		res.IsSigned = ss.IsSigned
		res.Verified = ss.Verified
		if owner != nil {
			signer := owner.Export()
			if signer != nil {
				res.Signer = *signer
			}
		}
		if ss.Entity != nil {
			bundle := libkb.NewPGPKeyBundle(ss.Entity)
			res.SignKey = bundle.Export()
		}
	}
	return res
}

func (h *PGPHandler) PGPImport(_ context.Context, arg keybase1.PGPImportArg) error {
	ctx := &engine.Context{
		SecretUI: h.getSecretUI(arg.SessionID),
		LogUI:    h.getLogUI(arg.SessionID),
	}
	eng, err := engine.NewPGPKeyImportEngineFromBytes(arg.Key, arg.PushSecret, nil)
	if err != nil {
		return err
	}
	err = engine.RunEngine(eng, ctx)
	return err
}

type exporter interface {
	engine.Engine
	Results() []keybase1.KeyInfo
}

func (h *PGPHandler) export(sessionID int, ex exporter) ([]keybase1.KeyInfo, error) {
	ctx := &engine.Context{
		SecretUI: h.getSecretUI(sessionID),
		LogUI:    h.getLogUI(sessionID),
	}
	if err := engine.RunEngine(ex, ctx); err != nil {
		return nil, err
	}
	return ex.Results(), nil
}

func (h *PGPHandler) PGPExport(_ context.Context, arg keybase1.PGPExportArg) (ret []keybase1.KeyInfo, err error) {
	return h.export(arg.SessionID, engine.NewPGPKeyExportEngine(arg, h.G()))
}

func (h *PGPHandler) PGPExportByKID(_ context.Context, arg keybase1.PGPExportByKIDArg) (ret []keybase1.KeyInfo, err error) {
	return h.export(arg.SessionID, engine.NewPGPKeyExportByKIDEngine(arg, h.G()))
}

func (h *PGPHandler) PGPExportByFingerprint(_ context.Context, arg keybase1.PGPExportByFingerprintArg) (ret []keybase1.KeyInfo, err error) {
	return h.export(arg.SessionID, engine.NewPGPKeyExportByFingerprintEngine(arg, h.G()))
}
func (h *PGPHandler) PGPKeyGen(_ context.Context, arg keybase1.PGPKeyGenArg) (err error) {
	earg := engine.ImportPGPKeyImportEngineArg(arg)
	return h.keygen(arg.SessionID, earg, true)
}

func (h *PGPHandler) keygen(sessionID int, earg engine.PGPKeyImportEngineArg, doInteractive bool) (err error) {
	ctx := &engine.Context{LogUI: h.getLogUI(sessionID), SecretUI: h.getSecretUI(sessionID)}
	earg.Gen.AddDefaultUID()
	eng := engine.NewPGPKeyImportEngine(earg)
	err = engine.RunEngine(eng, ctx)
	return err
}

func (h *PGPHandler) PGPKeyGenDefault(_ context.Context, arg keybase1.PGPKeyGenDefaultArg) (err error) {
	earg := engine.PGPKeyImportEngineArg{
		Gen: &libkb.PGPGenArg{
			Ids:         libkb.ImportPGPIdentities(arg.CreateUids.Ids),
			NoDefPGPUid: !arg.CreateUids.UseDefault,
		},
	}
	return h.keygen(arg.SessionID, earg, false)
}

func (h *PGPHandler) PGPDeletePrimary(_ context.Context, sessionID int) (err error) {
	return libkb.DeletePrimary()
}

func (h *PGPHandler) PGPSelect(_ context.Context, sarg keybase1.PGPSelectArg) error {
	arg := engine.GPGImportKeyArg{
		Query:      sarg.FingerprintQuery,
		AllowMulti: sarg.AllowMulti,
		SkipImport: sarg.SkipImport,
		OnlyImport: sarg.OnlyImport,
	}
	gpg := engine.NewGPGImportKeyEngine(&arg, h.G())
	ctx := &engine.Context{
		GPGUI:    h.getGPGUI(sarg.SessionID),
		SecretUI: h.getSecretUI(sarg.SessionID),
		LogUI:    h.getLogUI(sarg.SessionID),
		LoginUI:  h.getLoginUI(sarg.SessionID),
	}
	return engine.RunEngine(gpg, ctx)
}

func (h *PGPHandler) PGPUpdate(_ context.Context, arg keybase1.PGPUpdateArg) error {
	ctx := engine.Context{
		LogUI:    h.getLogUI(arg.SessionID),
		SecretUI: h.getSecretUI(arg.SessionID),
	}
	eng := engine.NewPGPUpdateEngine(arg.Fingerprints, arg.All, h.G())
	return engine.RunEngine(eng, &ctx)
}
