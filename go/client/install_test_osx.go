// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

// +build darwin

package client

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
)

func TestCommandLine(t *testing.T) {
	testDir, err := ioutil.TempDir("", "kbbin")
	defer os.RemoveAll(testDir)
	if err != nil {
		t.Fatalf("%s", err)
	}

	binPath, err := filepath.Abs(os.Args[0])
	if err != nil {
		t.Fatalf("%s", err)
	}
	linkPath := filepath.Join(testDir, "kbtest")

	// Install
	err = installCommandLineForBinPath(binPath, linkPath, true)
	if err != nil {
		t.Fatalf("%s", err)
	}
	_, err = os.Stat(linkPath)
	if err != nil {
		t.Fatalf("%s", err)
	}

	// Install again
	err = installCommandLineForBinPath(binPath, linkPath, true)
	if err != nil {
		t.Fatalf("%s", err)
	}
	_, err = os.Stat(linkPath)
	if err != nil {
		t.Fatalf("%s", err)
	}
}
