#! /bin/bash

#
# kbfsstage_release.sh creates kbfsstage releases.
#
# Call it with client and kbfs version number:
#
#    kbfsstage_release.sh <client version> <kbfs version>
#
# It does the following:
#
# 1. tags the kbfs repo with a version tag
# 2. exports the code to the kbfs-beta repo
# 3. updates the kbfsstage brew formula
#
# Soon, it will also call the linux package build script...
#

set -e -u -o pipefail

if [ "$#" -lt 2 ] ; then
	echo Usage: kbfsstage_release.sh CLIENT_VERSION KBFS_VERSION
	echo versions should be something like 1.0.3-245
	exit 1
fi

client_version="$1"
client_version_tag="v$client_version"
kbfs_version="$2"
kbfs_version_tag="v$kbfs_version"

clientdir="$GOPATH/src/github.com/keybase/client"
kbfsdir="$GOPATH/src/github.com/keybase/kbfs"
client_betadir=${CLIENT_BETADIR:-$GOPATH/src/github.com/keybase/client-beta}
kbfs_betadir=${KBFS_BETADIR:-$GOPATH/src/github.com/keybase/kbfs-beta}
brewdir=${BREWDIR:-$GOPATH/src/github.com/keybase/homebrew-beta}

if [ ! -d "$clientdir" ]; then
	echo "Need client repo, expecting it here: $clientdir"
	exit 1
fi

if [ ! -d "$kbfsdir" ]; then
	echo "Need kbfs repo, expecting it here: $kbfsdir"
	exit 1
fi

if [ ! -d "$client_betadir" ]; then
	echo "Need client-beta repo, expecting it here: $client_betadir"
	exit 1
fi

if [ ! -d "$kbfs_betadir" ]; then
	echo "Need kbfs-beta repo, expecting it here: $kbfs_betadir"
	exit 1
fi

if [ ! -d "$brewdir" ]; then
	echo "Need homebrew-beta repo, expecting it here: $brewdir"
	exit 1
fi

src_version="$(egrep -o "([0-9]{1,}\.)+[0-9]{1,}" $kbfsdir/libkbfs/version.go)"
build_number="$(egrep -o "const Build = \"\d+\"" $kbfsdir/libkbfs/version.go | egrep -o "\d+")"

if [ "$kbfs_version" != "$src_version-$build_number" ]; then
	echo Version $kbfs_version does not match libkbfs/version.go $src_version-$build_number
	echo source version: $src_version
	echo build number:   $build_number
	exit 1
fi

echo "-------------------------------------------------------------------------"
echo "Creating kbfsstage release for version $kbfs_version"
echo "-------------------------------------------------------------------------"
cd $kbfsdir
git checkout master

if ! git diff-index --quiet HEAD --; then
	echo "There are changes in $kbfsdir"
	exit 1
fi

git pull --ff-only
if git tag -a $kbfs_version_tag -m $kbfs_version_tag ; then
	echo "Tagged kbfs source with $kbfs_version_tag"
	git push --tags

	echo "Exporting client source to client-beta for version $client_version"
	$clientdir/packaging/export/export.sh client $client_betadir $client_version_tag
	cd $client_betadir
	git add .
	git commit -m "Importing client source from $client_version_tag"
	git push
	git tag -a $client_version_tag -m $client_version_tag
	git push --tags

	echo "Exporting kbfs source to kbfs-beta for version $kbfs_version"
	$clientdir/packaging/export/export.sh kbfs $kbfs_betadir $kbfs_version_tag
	cd $kbfs_betadir
	git add .
	git commit -m "Importing kbfs source from $kbfs_version_tag"
	git push
	git tag -a $kbfs_version_tag -m $kbfs_version_tag
	git push --tags
else
	echo "git tag $kbfs_version_tag failed on $kbfsdir, presumably it exists"
	echo "skipped client export to client-beta for client version $client_version and kbfs export to kbfs-beta for kbfs version $kbfs_version"
fi

src_url="https://github.com/keybase/kbfs-beta/archive/$kbfs_version_tag.tar.gz"
echo "Computing sha256 of $src_url"
src_sha="$(curl -f -L -s $src_url | shasum -a 256 | cut -f 1 -d ' ')"
echo "sha256 of $src_url is $src_sha"

echo "3. Updating kbfsstage brew formula"
sed -e "s/%VERSION%/$kbfs_version/g" -e "s/%VERSION_TAG%/$kbfs_version_tag/g" -e "s/%SRC_SHA%/$src_sha/g" $brewdir/kbfsstage.rb.tmpl > $brewdir/kbfsstage.rb
cd $brewdir
git checkout master
git pull --ff-only
if git commit -a -m "New kbfsstage version $kbfs_version_tag" ; then
	git push
	echo "Done.  brew update && brew upgrade kbfsstage should install version $kbfs_version"
else
	echo "$brewdir/kbfsstage.rb did not change."
fi
