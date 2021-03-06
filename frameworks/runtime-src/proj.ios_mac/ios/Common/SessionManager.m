//
//  SessionManager.m
//  TSOG CoreML
//
//  Created by Van Nguyen on 7/26/17.
//  Copyright © 2017 TheSchoolOfGames. All rights reserved.
//

#import "SessionManager.h"

@interface SessionManager () {
    
}

@property (nonatomic, strong) NSMutableDictionary *identifiedObjects;   // Identified objects
@property (nonatomic, assign) NSInteger objCount;                       // Objects count
@property (nonatomic, strong) NSURL *soundPath;
@property (nonatomic, strong) AVAudioPlayer *player;

@property (nonatomic, strong) NSMutableArray *animals;
@property (nonatomic, strong) NSMutableArray *objects;

@end

@implementation SessionManager

+ (SessionManager *)sharedInstance {
    static SessionManager *_instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _instance = [[SessionManager alloc] init];
        _instance.identifiedObjects = [NSMutableDictionary dictionary];
        _instance.elapsedTime = 30;
        _instance.diamondCount = 0;
        _instance.objCount = 0;
        _instance.animals = [_instance defaultAnimalList];
        _instance.objects = [_instance defaultObjectList];
    });
    
    return _instance;
}

- (NSInteger)getIdentifiedObjsCount {
    return self.objCount;
}

- (NSMutableDictionary *)getIdentifiedObjectsDict {
    return self.identifiedObjects;
}

- (NSArray *)getIdentifiedObjectsArray {
    NSArray *allKeys = self.identifiedObjects.allKeys;
    NSMutableArray *objects = [NSMutableArray array];
    for (NSString *key in allKeys) {
        NSDictionary *collection = [self.identifiedObjects objectForKey:key];
        for (NSString *item in collection.allKeys) {
            [objects addObject:item];
        }
    }
    return objects;
}

- (BOOL)addIdentifiedObject:(NSString *)objString {
    // Get first character
    NSString *firstCharacter = [objString substringToIndex:1];
    
    NSMutableDictionary *collection = [self.identifiedObjects objectForKey:firstCharacter];
    if (collection) {
        if ([collection objectForKey:objString]) {
            return NO;
        } else {
            [collection setObject:objString forKey:objString];
            [self.identifiedObjects setObject:collection forKey:firstCharacter];
            self.objCount++;
            return YES;
        }
    } else {
        collection = [NSMutableDictionary dictionaryWithObjectsAndKeys:objString, objString, nil];
        [self.identifiedObjects setObject:collection forKey:firstCharacter];
        self.objCount++;
        return YES;
    }
}

- (void)addArayOfIdentifiedObjects:(NSArray *)objArray {
    // Reset obj list
    self.identifiedObjects = [NSMutableDictionary dictionary];
    for (NSString *item in objArray) {
        [self addIdentifiedObject:item];
    }
}

- (void)vibrateFoundObj {
    // Vibrate
    AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

- (NSMutableArray *)defaultAnimalList {
    return [NSMutableArray arrayWithObjects:@"ant",
                           @"bat",
                           @"bear",
                           @"bee",
                           @"bird",
                           @"camel",
                           @"cat",
                           @"cheetah",
                           @"chicken",
                           @"chimpanzee",
                           @"cow",
                           @"crocodile",
                           @"deer",
                           @"dog",
                           @"dolphin",
                           @"donkey",
                           @"duck",
                           @"eagle",
                           @"elephant",
                           @"fish",
                           @"fly",
                           @"fox",
                           @"frog",
                           @"giraffe",
                           @"goat",
                           @"goldfish",
                           @"goose",
                           @"hamster",
                           @"hare",
                           @"hen",
                           @"horse",
                           @"insect",
                           @"kangaroo",
                           @"kitten",
                           @"lion",
                           @"lobster",
                           @"monkey",
                           @"mouse",
                           @"nest",
                           @"octopus",
                           @"owl",
                           @"panda",
                           @"parrot",
                           @"pet",
                           @"pig",
                           @"puppy",
                           @"rabbit",
                           @"rat",
                           @"scorpion",
                           @"seal",
                           @"shark",
                           @"sheep",
                           @"snail",
                           @"snake",
                           @"spider",
                           @"squirrel",
                           @"stork",
                           @"tiger",
                           @"tortoise",
                           @"turtle",
                           @"wolf",
                           @"zebra", nil];
}

- (NSMutableArray *)defaultObjectList {
    return [NSMutableArray arrayWithObjects:@"abacus",
                           @"afternoon",
                           @"animals",
                           @"apple",
                           @"arm",
                           @"artist",
                           @"asleep",
                           @"aunt",
                           @"bag",
                           @"ball",
                           @"banana",
                           @"book",
                           @"box",
                           @"boy",
                           @"brother",
                           @"bun",
                           @"bunch",
                           @"can",
                           @"cap",
                           @"carpenter",
                           @"chair",
                           @"cheer",
                           @"computer",
                           @"cousin",
                           @"crayon",
                           @"cup",
                           @"dad",
                           @"desk",
                           @"doctor",
                           @"driver",
                           @"duster",
                           @"egg",
                           @"engineer",
                           @"eraser",
                           @"fan",
                           @"fat",
                           @"father",
                           @"feather",
                           @"firefighter",
                           @"flag",
                           @"flowers",
                           @"forest",
                           @"gift",
                           @"grandfather",
                           @"grandmother",
                           @"grape",
                           @"grass",
                           @"hang",
                           @"happy",
                           @"hat",
                           @"heavy",
                           @"house",
                           @"hungry",
                           @"insect",
                           @"jar",
                           @"joker",
                           @"juice",
                           @"jump",
                           @"key",
                           @"king",
                           @"kitchen",
                           @"kite",
                           @"lamp",
                           @"lawyer",
                           @"leaf",
                           @"lemon",
                           @"light",
                           @"map",
                           @"mat",
                           @"medicine",
                           @"merchant",
                           @"mother",
                           @"musician",
                           @"nail",
                           @"narrow",
                           @"nest",
                           @"nose",
                           @"nurse",
                           @"onion",
                           @"orange",
                           @"pan",
                           @"pear",
                           @"pen",
                           @"pencils",
                           @"pie",
                           @"policeman",
                           @"pot",
                           @"potato",
                           @"queen",
                           @"raspberry",
                           @"rat",
                           @"river",
                           @"salt",
                           @"sat",
                           @"school",
                           @"seed",
                           @"sing",
                           @"sister",
                           @"sock",
                           @"soldier",
                           @"son",
                           @"soup",
                           @"sour",
                           @"star",
                           @"stars",
                           @"step",
                           @"stew",
                           @"stop",
                           @"strawberry",
                           @"sun",
                           @"table",
                           @"teacher",
                           @"tent",
                           @"test",
                           @"toe",
                           @"toes",
                           @"tomato",
                           @"towel",
                           @"toytrain",
                           @"tree",
                           @"trees",
                           @"tub",
                           @"umbrella",
                           @"uncle",
                           @"uniform",
                           @"van",
                           @"vegetable",
                           @"vehicle",
                           @"vest",
                           @"walk",
                           @"watch",
                           @"watermelon",
                           @"wing",
                           @"xmas",
                           @"xylophone",
                           @"yawn", nil];
}

- (NSString *)randomAnObjectOrAnimal:(NSArray *)foundObjects {
    // Update object list
    if (self.animals.count) {
        [self.animals removeObjectsInArray:foundObjects];
    }
    
    if (self.objects.count) {
        [self.objects removeObjectsInArray:foundObjects];
    }

    uint32_t upperBound = (uint32_t) (self.objects.count + self.animals.count);
    NSInteger index = arc4random_uniform(upperBound);
    if (index > self.animals.count - 1) {
        return self.objects[index - self.animals.count];
    } else {
        return self.animals[index];
    }
}

- (void)resetAllList {
    self.animals = [self defaultAnimalList];
    self.objects = [self defaultObjectList];
}

@end
