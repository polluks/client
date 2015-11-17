// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

package client

import (
	"fmt"
	"os"
	"syscall"
	"time"

	"github.com/keybase/cli"
	"github.com/keybase/client/go/libcmdline"
	"github.com/keybase/client/go/libkb"
	keybase1 "github.com/keybase/client/go/protocol"
)

const numRestartsDefault = 10

type CmdWatchdog struct {
	libkb.Contextified
	restarts int
}

func (c *CmdWatchdog) ParseArgv(ctx *cli.Context) error {
	c.restarts = ctx.Int("num-restarts")
	if c.restarts == 0 {
		c.restarts = numRestartsDefault
	}

	return nil
}

func (c *CmdWatchdog) Run() (err error) {
	// Watch over the running service
	// until it goes away, which will mean one of:
	// - crash
	// - system shutdown
	// - uninstall
	// - legitimate stoppage (ctl stop)

	// Testing loop:
	// - dial pipe. Pipe up equals service up.
	// - Do a blocking read. Server won't be writing anything,
	//   so this is our canary for shutdown.
	//   - If down, test existence of PidFile (maybe wait a moment).
	//      - No PidFile: normal shutdown. We stop too.
	//      - PidFile still there: crashed(?) Restart.
	//        (file should be writable in that case)
	//
	// Note that we give up after 10 consecutive crashes

	countdown := c.restarts
	for {
		// Blocking wait on service. First, there has to be a pid
		// file, because this is a forking command.
		var fn string
		if fn, err = c.G().Env.GetPidFile(); err != nil {
			return err
		}
		fd, err := os.Open(fn)
		if err != nil {
			return err
		}
		var pid int
		_, err = fmt.Fscanf(fd, "%d", &pid)
		fd.Close()

		if err != nil {
			return err
		}

		p, err := os.FindProcess(pid)
		if err != nil {
			return err
		}

		pstate, err := p.Wait()

		if err != nil || pstate.Exited() == false {
			c.G().Log.Warning("  ...with no error or exit")
			return err
		}

		if pstate.Success() {
			// apparently legitimate shutdown
			return nil
		}

		status := pstate.Sys().(syscall.WaitStatus)
		c.G().Log.Warning("  ...with status %v", status)
		if status.ExitStatus() == int(keybase1.ExitCode_RESTART) {
			// Restart. Wait a couple of seconds, then connect to the server.
			// We happen to know the restarter waits 2 seconds.
			c.G().Log.Warning("Watchdog sleeping and waiting for restart")
			time.Sleep(time.Second * 3)
			// This doesn't count against our limit
			countdown++
		}

		if countdown <= 0 {
			break
		}
		// restart server case (is this the right command line?)
		if _, err = ForkServer(c.G(), c.G().Env.GetCommandLine(), false); err != nil {
			return err
		}
		countdown--
	}

	return fmt.Errorf("Watchdog observed %d crashes in a row. NOT reforking.", c.restarts)
}

func NewCmdWatchdog(cl *libcmdline.CommandLine, g *libkb.GlobalContext) cli.Command {
	return cli.Command{
		Name:  "watchdog",
		Usage: "Start, watch and prop up the background service",
		Action: func(c *cli.Context) {
			cl.ChooseCommand(&CmdWatchdog{Contextified: libkb.NewContextified(g)}, "watchdog", c)
		},
		Flags: []cli.Flag{
			cli.IntFlag{
				Name:  "n, num-restarts",
				Value: numRestartsDefault,
				Usage: "specify the number of retries before giving up",
			},
		},
	}
}

func (c *CmdWatchdog) GetUsage() libkb.Usage {
	return libkb.Usage{}
}
