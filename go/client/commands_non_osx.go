// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

// +build !darwin

package client

import (
	"fmt"

	"github.com/keybase/cli"
	"github.com/keybase/client/go/libcmdline"
	"github.com/keybase/client/go/libkb"
)

func getPlatformSpecificCommands(cl *libcmdline.CommandLine, g *libkb.GlobalContext) []cli.Command {
	return []cli.Command{}
}

func AutoInstall(g *libkb.GlobalContext, binPath string, force bool) (newProc bool, err error) {
	return false, fmt.Errorf("Auto install only supported for OS X")
}

// DebugSocketError allows platforms to help the user diagnose and resolve
// socket errors.
func DiagnoseSocketError(ui libkb.UI, err error) {}
