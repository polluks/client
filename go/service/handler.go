// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

package service

import (
	"github.com/keybase/client/go/libkb"
	keybase1 "github.com/keybase/client/go/protocol"
	rpc "github.com/keybase/go-framed-msgpack-rpc"
	"golang.org/x/net/context"
)

type BaseHandler struct {
	xp        rpc.Transporter
	cli       *rpc.Client
	loginCli  *keybase1.LoginUiClient
	secretCli *keybase1.SecretUiClient
	logCli    *keybase1.LogUiClient
}

func NewBaseHandler(xp rpc.Transporter) *BaseHandler {
	h := &BaseHandler{xp: xp}
	h.cli = rpc.NewClient(h.xp, libkb.ErrorUnwrapper{})
	h.loginCli = &keybase1.LoginUiClient{Cli: h.cli}
	h.secretCli = &keybase1.SecretUiClient{Cli: h.cli}
	h.logCli = &keybase1.LogUiClient{Cli: h.cli}

	return h
}

type LoginUI struct {
	sessionID int
	cli       *keybase1.LoginUiClient
}

func (u *LoginUI) GetEmailOrUsername(ctx context.Context, _ int) (string, error) {
	return u.cli.GetEmailOrUsername(ctx, u.sessionID)
}

func (u *LoginUI) PromptRevokePaperKeys(ctx context.Context, arg keybase1.PromptRevokePaperKeysArg) (bool, error) {
	arg.SessionID = u.sessionID
	return u.cli.PromptRevokePaperKeys(ctx, arg)
}

func (u *LoginUI) DisplayPaperKeyPhrase(ctx context.Context, arg keybase1.DisplayPaperKeyPhraseArg) error {
	arg.SessionID = u.sessionID
	return u.cli.DisplayPaperKeyPhrase(ctx, arg)
}

func (u *LoginUI) DisplayPrimaryPaperKey(ctx context.Context, arg keybase1.DisplayPrimaryPaperKeyArg) error {
	arg.SessionID = u.sessionID
	return u.cli.DisplayPrimaryPaperKey(ctx, arg)
}

type SecretUI struct {
	sessionID int
	cli       *keybase1.SecretUiClient
}

// GetSecret gets a free-form secret from a pinentry
func (l *SecretUI) GetSecret(pinentry keybase1.SecretEntryArg, terminal *keybase1.SecretEntryArg) (*keybase1.SecretEntryRes, error) {
	res, err := l.cli.GetSecret(context.TODO(), keybase1.GetSecretArg{SessionID: l.sessionID, Pinentry: pinentry, Terminal: terminal})
	return &res, err
}

// GetNewPassphrase gets a new passphrase from pinentry
func (l *SecretUI) GetNewPassphrase(arg keybase1.GetNewPassphraseArg) (keybase1.GetPassphraseRes, error) {
	arg.SessionID = l.sessionID
	return l.cli.GetNewPassphrase(context.TODO(), arg)
}

// GetKeybasePassphrase gets the current keybase passphrase from pinentry.
func (l *SecretUI) GetKeybasePassphrase(arg keybase1.GetKeybasePassphraseArg) (keybase1.GetPassphraseRes, error) {
	arg.SessionID = l.sessionID
	return l.cli.GetKeybasePassphrase(context.TODO(), arg)
}

// GetPaperKeyPassphrase gets a paper key passphrase from pinentry (if
// possible).
func (l *SecretUI) GetPaperKeyPassphrase(arg keybase1.GetPaperKeyPassphraseArg) (string, error) {
	arg.SessionID = l.sessionID
	return l.cli.GetPaperKeyPassphrase(context.TODO(), arg)
}

// GetPinSecret gets the current keybase passphrase from delegated pinentry.
func (l *SecretUI) GetPassphrase(pinentry keybase1.GUIEntryArg, terminal *keybase1.SecretEntryArg) (keybase1.GetPassphraseRes, error) {
	return l.cli.GetPassphrase(context.TODO(), keybase1.GetPassphraseArg{SessionID: l.sessionID, Pinentry: pinentry, Terminal: terminal})
}

func (h *BaseHandler) rpcClient() *rpc.Client {
	return h.cli
}

func (h *BaseHandler) getLoginUICli() *keybase1.LoginUiClient {
	return h.loginCli
}

func (h *BaseHandler) getLoginUI(sessionID int) libkb.LoginUI {
	return &LoginUI{sessionID, h.getLoginUICli()}
}

func (h *BaseHandler) getGPGUI(sessionID int) libkb.GPGUI {
	return NewRemoteGPGUI(sessionID, h.rpcClient())
}

func (h *BaseHandler) getSecretUICli() *keybase1.SecretUiClient {
	return h.secretCli
}

func (h *BaseHandler) getSecretUI(sessionID int) libkb.SecretUI {
	return &SecretUI{sessionID, h.getSecretUICli()}
}

func (h *BaseHandler) getLogUICli() *keybase1.LogUiClient {
	return h.logCli
}

func (h *BaseHandler) getLogUI(sessionID int) libkb.LogUI {
	return &LogUI{sessionID, h.getLogUICli()}
}

func (h *BaseHandler) getProvisionUI(sessionID int) libkb.ProvisionUI {
	return NewRemoteProvisionUI(sessionID, h.rpcClient())
}

func (h *BaseHandler) getStreamUICli() *keybase1.StreamUiClient {
	return &keybase1.StreamUiClient{Cli: h.rpcClient()}
}

func (h *BaseHandler) NewRemoteIdentifyUI(sessionID int, g *libkb.GlobalContext) *RemoteIdentifyUI {
	c := h.rpcClient()
	return &RemoteIdentifyUI{
		sessionID:    sessionID,
		uicli:        keybase1.IdentifyUiClient{Cli: c},
		logUI:        h.getLogUI(sessionID),
		Contextified: libkb.NewContextified(g),
	}
}

func (h *BaseHandler) NewRemoteSkipPromptIdentifyUI(sessionID int, g *libkb.GlobalContext) *RemoteIdentifyUI {
	c := h.NewRemoteIdentifyUI(sessionID, g)
	c.skipPrompt = true
	return c
}
