// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

package client

import (
	"github.com/keybase/client/go/libkb"
)

// Keep this around to simplify things
var G = libkb.G
var GlobUI *UI

func InitUI() {
	GlobUI = &UI{}
	G.SetUI(GlobUI)
}
