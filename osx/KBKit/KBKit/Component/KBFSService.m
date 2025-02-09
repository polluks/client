//
//  KBFSService.m
//  Keybase
//
//  Created by Gabriel on 5/15/15.
//  Copyright (c) 2015 Gabriel Handford. All rights reserved.
//

#import "KBFSService.h"
#import "KBDebugPropertiesView.h"
#import "KBKeybaseLaunchd.h"
#import "KBSemVersion.h"
#import "KBTask.h"

@interface KBFSService ()
@property NSString *label;
@property KBSemVersion *bundleVersion;
@property KBRServiceStatus *serviceStatus;

@property YOView *infoView;
@end

@implementation KBFSService

- (instancetype)initWithConfig:(KBEnvConfig *)config label:(NSString *)label {
if ((self = [self initWithConfig:config name:@"KBFS" info:@"The filesystem service" image:[KBIcons imageForIcon:KBIconNetwork]])) {
    _label = label;
    NSDictionary *info = [[NSBundle mainBundle] infoDictionary];
    _bundleVersion = [KBSemVersion version:info[@"KBFSVersion"] build:info[@"KBFSBuild"]];
  }
  return self;
}

- (NSView *)componentView {
  [self componentDidUpdate];
  return _infoView;
}

- (void)componentDidUpdate {
  GHODictionary *info = [GHODictionary dictionary];

  info[@"Mount"] = [self.config mountDir];

  GHODictionary *statusInfo = [self.componentStatus statusInfo];
  if (statusInfo) [info addEntriesFromOrderedDictionary:statusInfo];

  YOView *view = [[YOView alloc] init];
  KBDebugPropertiesView *propertiesView = [[KBDebugPropertiesView alloc] init];
  [propertiesView setProperties:info];
  NSView *scrollView = [KBScrollView scrollViewWithDocumentView:propertiesView];
  [view addSubview:scrollView];

  YOHBox *buttons = [YOHBox box:@{@"spacing": @(10)}];
  [view addSubview:buttons];

  view.viewLayout = [YOVBorderLayout layoutWithCenter:scrollView top:nil bottom:@[buttons] insets:UIEdgeInsetsZero spacing:10];

  _infoView = view;
}

- (KBInstallRuntimeStatus)runtimeStatus {
  if (!self.serviceStatus) return KBInstallRuntimeStatusNone;
  return [NSString gh_isBlank:self.serviceStatus.pid] ? KBInstallRuntimeStatusStopped : KBInstallRuntimeStatusStarted;
}

- (void)install:(KBCompletion)completion {
  NSString *binPath = [self.config serviceBinPathWithPathOptions:0 useBundle:YES];
  [KBTask execute:binPath args:@[@"-d", @"install", @"--components=kbfs"] completion:^(NSError *error, NSData *outData, NSData *errData) {
    completion(error);
  }];
}

- (void)uninstall:(KBCompletion)completion {
  [KBKeybaseLaunchd run:[self.config serviceBinPathWithPathOptions:0 useBundle:YES] args:@[@"launchd", @"uninstall", _label] completion:completion];
}

- (void)start:(KBCompletion)completion {
  [KBKeybaseLaunchd run:[self.config serviceBinPathWithPathOptions:0 useBundle:YES] args:@[@"launchd", @"start", _label] completion:completion];
}

- (void)stop:(KBCompletion)completion {
  [KBKeybaseLaunchd run:[self.config serviceBinPathWithPathOptions:0 useBundle:YES] args:@[@"launchd", @"stop", _label] completion:completion];
}

- (void)refreshComponent:(KBCompletion)completion {
  [KBKeybaseLaunchd status:[self.config serviceBinPathWithPathOptions:0 useBundle:YES] name:@"kbfs" bundleVersion:_bundleVersion completion:^(NSError *error, KBRServiceStatus *serviceStatus) {
    self.serviceStatus = serviceStatus;
    self.componentStatus = [KBComponentStatus componentStatusWithServiceStatus:serviceStatus];
    [self componentDidUpdate];
    completion(error);
  }];
}

@end

