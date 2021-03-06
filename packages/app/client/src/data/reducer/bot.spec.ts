//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
// Microsoft Bot Framework: http://botframework.com
//
// Bot Framework Emulator Github:
// https://github.com/Microsoft/BotFramwork-Emulator
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

// Jest mock statements need to be placed above imports
// as they are not hoisted above them automatically
// (Makes tests that use getBotInfoByPath() very fragile -- order matters)
// https://github.com/kulshekhar/ts-jest/issues/90
jest.mock('../botHelpers', () => {
  const testBotInfo: BotInfo = {
    displayName: 'testname',
    path: 'testpath',
    secret: null
  };

  return {
    getBotInfoByPath: jest.fn()
                          .mockReturnValue(null)
                          .mockReturnValueOnce(null)
                          .mockReturnValueOnce(testBotInfo)
  };
});

import bot, { BotState } from './bot';
import { BotAction, create, load, patch, setActive, close } from '../action/botActions';
import { BotInfo } from '@bfemulator/app-shared';
import { BotConfigWithPath } from '@bfemulator/sdk-shared';

describe('Bot reducer tests', () => {
  const DEFAULT_STATE: BotState = {
    activeBot: null,
    botFiles: []
  };

  it('should return unaltered state for non-matching action type', () => {
    const emptyAction: BotAction = { type: null, payload: null };
    const startingState = { ...DEFAULT_STATE };
    const endingState = bot(DEFAULT_STATE, emptyAction);
    expect(endingState).toEqual(startingState);
  });
  
  it('should create a bot', () => {
    const testbot: BotConfigWithPath = {
      name: 'bot1',
      description: '',
      secretKey: null,
      services: [],
      path: 'testpath'
    };

    const action = create(testbot, testbot.path, 'testsecret');
    const state = bot(DEFAULT_STATE, action);
    expect(state.botFiles[0]).toBeTruthy();
    expect(state.botFiles[0].displayName).toBe('bot1');
    expect(state.botFiles[0].path).toBe('testpath');
    expect(state.botFiles[0].secret).toBe('testsecret');
  });

  describe('setting a bot as active', () => {
    const testbot: BotConfigWithPath = {
      name: 'bot1',
      description: '',
      secretKey: null,
      services: [],
      path: 'testpath'
    };

    it('should set a bot as active', () => {
      const action = setActive(testbot);
      const state = bot(DEFAULT_STATE, action);
      expect(state.activeBot).toBe(testbot);
    });

    it('should move the bot to the top of the recently used bots list', () => {
      const testbots: BotInfo[] = [
        {
          displayName: 'bot2',
          path: 'path2',
          secret: 'test-secret'
        },
        {
          displayName: 'bot3',
          path: 'path3',
          secret: null
        },
        {
          displayName: 'bot1',
          path: 'testpath',
          secret: null
        },
      ];

      const startingState: BotState = {
        ...DEFAULT_STATE,
        botFiles: testbots
      };
      
      const action = setActive(testbot);
      const endingState = bot(startingState, action);
      expect(endingState.botFiles[0].path).toBe('testpath');
    });
  });

  describe('patching a bot', () => {
    const activeBot: BotConfigWithPath = {
      name: '',
      description: '',
      secretKey: null,
      services: [],
      path: 'testpath'
    };

    const testBots: BotInfo[] = [
      {
        displayName: '',
        path: 'testpath',
        secret: null
      }
    ];
    
    const startingState: BotState = {
      ...DEFAULT_STATE,
      activeBot,
      botFiles: testBots
    };

    const updatedBot: BotConfigWithPath = {
      name: 'testbot',
      description: '',
      secretKey: null,
      services: [],
      path: 'testpath'
    };

    it('should patch the active bot', () => {
      const action = patch(updatedBot);
      const endingState = bot(startingState, action);
      expect(endingState.activeBot).not.toEqual(activeBot);
      expect(endingState.activeBot.name).toBe('testbot');
    });

    it('should update the recent bots list entry', () => {
      const action = patch(updatedBot, 'testsecret');
      const endingState = bot(startingState, action);
      expect(endingState.botFiles.length).toBeGreaterThan(0);
      expect(endingState.botFiles[0].path).toBe('testpath');
      expect(endingState.botFiles[0].displayName).toBe('testbot');
      expect(endingState.botFiles[0].secret).toBe('testsecret');
    });

    // clear mocks
    jest.unmock('../botHelpers');
  });

  it('should load an array of bots', () => {
    const bots: BotInfo[] = [
      {
        displayName: 'bot1',
        path: 'path1',
        secret: null
      },
      {
        displayName: 'bot2',
        path: 'path2',
        secret: 'test-secret'
      },
      {
        displayName: 'bot3',
        path: 'path3',
        secret: null
      }
    ];
    const action = load(bots);
    const state = bot(DEFAULT_STATE, action);
    expect(state.botFiles).toEqual(bots);
  });

  it('should close a bot', () => {
    const startingState: BotState = {
      ...DEFAULT_STATE,
      activeBot: {
        name: 'bot',
        description: 'this is a test bot',
        secretKey: null,
        services: []
      }
    };
    const action = close();
    const endingState = bot(startingState, action);
    expect(endingState.activeBot).toBe(null);
  });
});
