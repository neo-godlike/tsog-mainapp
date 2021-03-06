//
//  Constants.h
//  TSOG CoreML
//
//  Created by Van Nguyen on 7/26/17.
//  Copyright © 2017 TheSchoolOfGames. All rights reserved.
//

#ifndef Constants_h
#define Constants_h

#define DEBUG_MODE                  0

#define kRecognitionThresholdMax    0.6
#define kRecognitionThresholdMin    0.35
#define kAnimatedFontSize           60.0
#define kShowMeAnObject             @"Show me an object..."
#define kYouFoundIt                 @"Yay you found it!"

#define kFindObject                 @"Find object..."

/** Degrees to Radian **/
#define degreesToRadians(degrees)   ((degrees)/180.0*M_PI)

/** Color util **/
#define UIColorFromRGB(rgbValue)    [UIColor \
                                    colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 \
                                    green:((float)((rgbValue & 0xFF00) >> 8))/255.0 \
                                    blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

#endif /* Constants_h */
