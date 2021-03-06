//
//  SpeechRecognitionListener.h
//  tsog
//
//  Created by Thuy Dong Xuan on 12/11/15.
//
//

#import <Foundation/Foundation.h>

#import "OEEventsObserver.h"

@interface SpeechRecognitionListener : NSObject <OEEventsObserverDelegate>

+ (SpeechRecognitionListener *)sharedEngine;

- (BOOL)setLanguageData:(NSString*)languageCode array:(NSArray *)array;
- (void)start;
- (void)stop;
- (void)suspend;

- (BOOL)isListening;

@end
