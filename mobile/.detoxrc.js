module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/AnkiMobile.app',
      build: 'xcodebuild -workspace ios/AnkiMobile.xcworkspace -scheme AnkiMobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/AnkiMobile.app',
      build: 'xcodebuild -workspace ios/AnkiMobile.xcworkspace -scheme AnkiMobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    },
    ipad: {
      type: 'ios.simulator',
      device: {
        type: 'iPad Pro (12.9-inch) (6th generation)'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release'
    },
    'ios.ipad.debug': {
      device: 'ipad',
      app: 'ios.debug'
    }
  }
};
