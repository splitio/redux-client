export const sdkBrowserLocalhost: SplitIO.IBrowserSettings = {
  core: {
    authorizationKey: 'localhost',
    key: 'customer-key',
  },
  features: {
    test_split: 'on',
    Test_Another_Split: 'dark',
    Test_Something_Else: 'off',
  },
};

export const sdkBrowserConfig: SplitIO.IBrowserSettings = {
  core: {
    authorizationKey: 'API KEY',
    key: 'customer-key',
  },
};

export const sdkNodeConfig: SplitIO.INodeSettings = {
  core: {
    authorizationKey: 'API KEY',
  },
};
