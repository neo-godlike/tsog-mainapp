package com.h102;

import com.android.vending.billing.IInAppBillingService;
import com.facebook.share.model.ShareLinkContent;
import com.facebook.share.widget.ShareDialog;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Executors;

import com.hub102.tsog.BuildConfig;
import com.twitter.sdk.android.tweetcomposer.TweetComposer;

import android.Manifest;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.media.AudioRecord;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.RemoteException;
import android.os.SystemClock;
import android.provider.Settings;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.NotificationManagerCompat;
import android.support.v4.app.TaskStackBuilder;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.NotificationCompat;
import android.util.Log;

import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

public class Wrapper
{
    public static AppActivity activity;

    private static final int MY_PERMISSIONS_REQUEST_CODE = 111;
    public static final int DAILY_LOCAL_NOTIFICATION_TAG = 11;
    public static final int TWO_DAYS_NOTIFICATION_TAG = 22;
    private static IInAppBillingService mService;

    private static ServiceConnection mServiceConn = new ServiceConnection() {
        @Override
        public void onServiceDisconnected(ComponentName name) {
            mService = null;
        }

        @Override
        public void onServiceConnected(ComponentName name,
                                       IBinder service) {
            mService = IInAppBillingService.Stub.asInterface(service);
        }
    };

    public static void initInAppBillingService(){
        Intent serviceIntent =
                new Intent("com.android.vending.billing.InAppBillingService.BIND");
        serviceIntent.setPackage("com.android.vending");
        activity.bindService(serviceIntent, mServiceConn, Context.BIND_AUTO_CREATE);
    }

    public static void unbindInAppBillingService(){
        if (mService != null) {
            activity.unbindService(mServiceConn);
        }
    }

    public static String getPurchases() throws RemoteException {
        Bundle ownedItems = mService.getPurchases(3, activity.getPackageName(), "subs", null);

        String purchaseDatasJson = "[";

        int response = ownedItems.getInt("RESPONSE_CODE");
        if (response == 0) {
            ArrayList<String> ownedSkus =
                    ownedItems.getStringArrayList("INAPP_PURCHASE_ITEM_LIST");
            ArrayList<String>  purchaseDataList =
                    ownedItems.getStringArrayList("INAPP_PURCHASE_DATA_LIST");
            ArrayList<String>  signatureList =
                    ownedItems.getStringArrayList("INAPP_DATA_SIGNATURE_LIST");
            String continuationToken =
                    ownedItems.getString("INAPP_CONTINUATION_TOKEN");
            
            for (int i = 0; i < purchaseDataList.size(); ++i) {
                String purchaseData = purchaseDataList.get(i);
                String signature = signatureList.get(i);
                String sku = ownedSkus.get(i);

                purchaseDatasJson += purchaseData;
                purchaseDatasJson += ",";

                // do something with this purchase information
                // e.g. display the updated list of products owned by user
            }

            // if continuationToken != null, call getPurchases again
            // and pass in the token to retrieve more items
        }

        purchaseDatasJson += "]";

        return purchaseDatasJson;
    }

    public static String getVersionName() {
        return BuildConfig.VERSION_NAME;
    }

    public static String getVersionCode() {
        return BuildConfig.VERSION_CODE + "";
    }

    public static void showUpdateDialog(final String version, final boolean forceUpdate) {
        activity.runOnUiThread(new Runnable() {
           @Override
           public void run() {
               Dialog.show(activity, version, 0, forceUpdate);
           }
        });
    }

    public static void fabricCustomLogging(String key, String value) {
//        Crashlytics.getInstance().core.setString(key, value);
    }

    public static String getId() {
        return Settings.Secure.getString(activity.getContentResolver(), Settings.Secure.ANDROID_ID);
    }

    public static void segmentIdentity(final String userId, final String traits) {
        // new Thread() {
        //     public void run() {
        //         Map<String, Object> retMap = new Gson().fromJson(traits, new TypeToken<HashMap<String, Object>>() {
        //         }.getType());

        //         Traits t = new Traits();
        //         for (Map.Entry<String, Object> entry : retMap.entrySet()) {
        //             t.putValue(entry.getKey(), entry.getValue());
        //         }

        //         Analytics.with(activity).identify(userId, t, null);
        //     }
        // }.start();
    }

    public static void segmentTrack(final String event, final String properties) {
        // new Thread() {
        //     public void run() {
        //         Map<String, Object> retMap = new Gson().fromJson(properties, new TypeToken<HashMap<String, Object>>() {
        //         }.getType());

        //         Properties p = new Properties();
        //         for (Map.Entry<String, Object> entry : retMap.entrySet()) {
        //             p.putValue(entry.getKey(), entry.getValue());
        //         }
        //         Analytics.with(activity).track(event, p);
        //     }
        // }.start();
    }

    public static void showMessage(String title, String message) {
        final String aTitle = title, aMessage = message;
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                AlertDialog alertDialog = new AlertDialog.Builder(activity).create();
                alertDialog.setTitle(aTitle);
                alertDialog.setMessage(aMessage);
                alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "OK",
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                dialog.dismiss();
                            }
                        });
                alertDialog.show();
            }
        });
    }

//    public static boolean isRecording() {
//        return Recorder.getInstance().isRecording();
//    }

    public static void startFetchingAudio() {
        Wrapper.ensureRunBlockWithRecorderSuccessfullySetup(new Runnable() {
            @Override
            public void run() {
                Recorder.getInstance().startFetchingAudio();
            }
        });
    }

    public static void stopFetchingAudio() {
        try {
            Recorder.getInstance().stopFetchingAudio();
        } catch (Exception e) {}
    }

    public static void changeSpeechLanguageArray(String languageCode, String serializedString) throws IOException {
        ArrayList<String> arrayList = new Gson().fromJson(serializedString, new TypeToken<ArrayList<String>>() {}.getType());
        SpeechRecognizer.getInstance().updateNewLanguageArray(languageCode, arrayList);
    }

    public static void startSpeechRecognition(final int timeout) {
        SpeechRecognizer.getInstance().start();

        if (timeout > 0) {
            final Handler handler = new Handler(Looper.getMainLooper());
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    SpeechRecognizer.getInstance().stop();
                }
            }, timeout);
        }

    }

    public static void stopSpeechRecognition() {
        SpeechRecognizer.getInstance().stop();
    }

    public static void startDetectingNoiseLevel(final float detectingTime) {
        Wrapper.ensureRunBlockWithRecorderSuccessfullySetup(new Runnable() {
            @Override
            public void run() {
                final int noiseDetectionLoopCount = (int)(detectingTime / 0.1f);

                Recorder.getInstance().startFetchingAudio();
                Recorder.getInstance().audioRecorder.setRecordPositionUpdateListener(new AudioRecord.OnRecordPositionUpdateListener() {
                    int count = noiseDetectionLoopCount;
                    final List<Double> noiseDetectionArray = new ArrayList<>();

                    @Override
                    public void onMarkerReached(AudioRecord recorder) {

                    }

                    @Override
                    public void onPeriodicNotification(AudioRecord recorder) {
                        count--;

                        if (count < 0) {
                            Wrapper.stopFetchingAudio();

                            Double sum = 0d;
                            for (Double vals : noiseDetectionArray) {
                                sum += vals;
                            }
                            Double avgAmpl = sum / noiseDetectionArray.size();
                            Log.w("WRAPPER", avgAmpl + "");

                            final String value = avgAmpl > 33 ? "true" : "false";

                            activity.runOnGLThread(new Runnable() {
                                @Override
                                public void run() {
                                    Cocos2dxJavascriptJavaBridge.evalString("NativeHelper.onReceive('noiseDetectingLoop', 'onNoiseDetected', [" + value + "])");
                                }
                            });

//                            final String command = String.format("SpeakingTestLayer.shouldSkipTest=%s", value);
//                            Wrapper.activity.runOnGLThread(new Runnable() {
//                                @Override
//                                public void run() {
//                                    Cocos2dxJavascriptJavaBridge.evalString(command);
//                                }
//                            });

                        } else {
                            int readAudio = recorder.read(Recorder.getInstance().buffer, 0, Recorder.getInstance().buffer.length); // Fill buffer
                            if (readAudio == AudioRecord.ERROR_BAD_VALUE || readAudio == AudioRecord.ERROR_INVALID_OPERATION)
                                return;

                            double fN = (double) readAudio;
                            double accum = 0;
                            for (int i = 0; i < readAudio; i++)
                                accum += Math.abs((double) Recorder.getInstance().buffer[i]);

                            double soundLevel = accum / fN;

                            noiseDetectionArray.add(soundLevel);
                        }
                    }
                });
            }
        });
    }

    public static void cancelNoiseDetecting() {
        Recorder.getInstance().stopFetchingAudio();
    }

    public static void openUrlWith(final String url) {
        Intent intent= new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        activity.startActivity(intent);
    }

    public static boolean hasGrantPermission(String permission) {
        try {
            String fullPermissionString = Wrapper.getFullPermissionString(permission);

            boolean bool = ContextCompat.checkSelfPermission(activity, fullPermissionString) == PackageManager.PERMISSION_GRANTED;

            return bool;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private static void actualRequestPermission(String permission) {
        try {
            String fullPermissionString = Wrapper.getFullPermissionString(permission);

            ActivityCompat.requestPermissions(activity,
                                            new String[]{fullPermissionString},
                    Wrapper.MY_PERMISSIONS_REQUEST_CODE);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void requestPermission(String permission) {
        if (permission.equals("RECORD_AUDIO")) {
            final String apermission = permission, aMessage = "To play with Adi, we need Audio Permission";
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    AlertDialog alertDialog = new AlertDialog.Builder(activity).create();
                    alertDialog.setTitle("");
                    alertDialog.setMessage(aMessage);
                    alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "OK",
                            new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int which) {
                                    dialog.dismiss();

                                    actualRequestPermission(apermission);
                                }
                            });
                    alertDialog.show();
                }
            });
        } else {
            actualRequestPermission(permission);
        }
    }

    public static void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        switch (requestCode) {
            case Wrapper.MY_PERMISSIONS_REQUEST_CODE: {
                // If request is cancelled, the result arrays are empty.
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED) {

                    activity.runOnGLThread(new Runnable() {
                        @Override
                        public void run() {
                            Cocos2dxJavascriptJavaBridge.evalString("NativeHelper.onReceive('RequestPermission', 'onRequestPermission', [true])");
                        }
                    });

                } else {
                    activity.runOnGLThread(new Runnable() {
                        @Override
                        public void run() {
                            Cocos2dxJavascriptJavaBridge.evalString("NativeHelper.onReceive('RequestPermission', 'onRequestPermission', [false])");
                        }
                    });

                    // permission denied, boo! Disable the
                    // functionality that depends on this permission.
                }
                return;
            }
            // other 'case' lines to check for other
            // permissions this app might request
        }
    }

    private static String getFullPermissionString(String permission) throws NoSuchFieldException, IllegalAccessException {
        return (String) Manifest.permission.class.getDeclaredField(permission).get(null);
    }

    private static void ensureRunBlockWithRecorderSuccessfullySetup(Runnable runnable) {
        if (SpeechRecognizer.getInstance().recognizer == null)
            SpeechRecognizer.getInstance().setupCallback = runnable;
        else
            Executors.newSingleThreadExecutor().execute(runnable);
    }

    public static void shareNative(String caption, String url) {
        Intent sendIntent = new Intent();
        sendIntent.setAction(Intent.ACTION_SEND);
        sendIntent.putExtra(Intent.EXTRA_TITLE, caption);
        sendIntent.putExtra(Intent.EXTRA_TEXT, url);
        sendIntent.setType("text/plain");
        activity.startActivity(sendIntent);
    }

    public static void shareWhatsapp(String caption, String url) {
        Intent sendIntent = new Intent();
        sendIntent.setAction(Intent.ACTION_SEND);
        sendIntent.putExtra(Intent.EXTRA_TEXT, caption + " " + url);
        sendIntent.setType("text/plain");
        sendIntent.setPackage("com.whatsapp");
        try {
            activity.startActivity(sendIntent);
        } catch (android.content.ActivityNotFoundException ex) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
//                    Toast.makeText(activity, "Whatsapp have not been installed.", Toast.LENGTH_SHORT).show();
                    new AlertDialog.Builder(activity)
                            .setTitle("WhatsApp not installed")
                            .setMessage("Your device has no WhatsApp installed.")
                            .setPositiveButton(android.R.string.yes, new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int which) {
                                    // continue with delete
                                }
                            })
                            .setIcon(android.R.drawable.ic_dialog_alert)
                            .show();
                }
            });
        }
    }

    public static void shareFacebook(String title, String description, String url) {
        ShareLinkContent content = new ShareLinkContent.Builder()
                .setContentUrl(Uri.parse(url))
                .setContentDescription(description)
                .setContentTitle(title)
                .build();

        ShareDialog shareDialog = new ShareDialog(activity);

        if (!shareDialog.canShow(content, ShareDialog.Mode.NATIVE)) {
            shareDialog.show(content, ShareDialog.Mode.WEB);
        } else {
            shareDialog.show(content, ShareDialog.Mode.NATIVE);
        }
    }

    public static void shareTwitter(String description, String url) {
//        String tweetUrl = "https://twitter.com/intent/tweet?text=" + description + "&url="
//                + url;
//        Uri uri = Uri.parse(tweetUrl);
////        activity.startActivity(new Intent(Intent.ACTION_VIEW, uri));
//        Intent i = new Intent(Intent.ACTION_SEND);
//        i.setClassName("com.twitter.android","com.twitter.android.PostActivity");
//        i.setType("text/plain");
//        i.putExtra(Intent.EXTRA_SUBJECT, description);
//        i.putExtra(Intent.EXTRA_TEXT, url);
//        activity.startActivity(Intent.createChooser(i, "Share URL"));
        try {
            Intent intent = new TweetComposer.Builder(activity)
                    .text(description)
                    .url(new URL(url))
                    .createIntent();
            activity.startActivityForResult(intent, 100);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static String getCountryCode() {
        return Locale.getDefault().getCountry();
    }

    public static void startLocalNotificationWithFireDate(String id, int fireDateInSeconds) {
        int tag = getNotificationTagWithId(id);

        AlarmManager alarmManager = (AlarmManager) activity.getApplicationContext().getSystemService(Context.ALARM_SERVICE);

        Intent notificationIntent = new Intent("android.media.action.DISPLAY_NOTIFICATION");
        notificationIntent.addCategory("android.intent.category.DEFAULT");

        PendingIntent broadcast = PendingIntent.getBroadcast(activity, tag, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);

        alarmManager.set(AlarmManager.ELAPSED_REALTIME,
                SystemClock.elapsedRealtime() + fireDateInSeconds * 1000, broadcast);
    }

    public static void startDailyNotif() {
        startLocalNotificationWithFireDate("kTagDailyLocalNotif", 86400);
    }
    public static void startTwoDaysNotif() {
        startLocalNotificationWithFireDate("kTagTwoDaysLocalNotif", 172800);
    }

    public static void cancelLocalNotificationsWithTag(String id) {
        int tag = getNotificationTagWithId(id);
        Intent intent = new Intent("android.media.action.DISPLAY_NOTIFICATION");
        PendingIntent pendingIntent = PendingIntent.getBroadcast(activity.getApplicationContext(), tag, intent, 0);
        AlarmManager alarmManager = (AlarmManager) activity.getApplicationContext().getSystemService(Context.ALARM_SERVICE);
        alarmManager.cancel(pendingIntent);
    }

    public static int getNotificationTagWithId (String id) {
        int tag = DAILY_LOCAL_NOTIFICATION_TAG;
        if (id.equalsIgnoreCase("kTagTwoDaysLocalNotif")) {
            tag = TWO_DAYS_NOTIFICATION_TAG;
        }
        return tag;
    }

    public static boolean isOpenedFromNotification() {
        return activity.isOpenedFromNotification;
    }

    public static void openStore() {
        final String appPackageName = activity.getPackageName(); // getPackageName() from Context or Activity object
        try {
            activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + appPackageName)));
        } catch (android.content.ActivityNotFoundException anfe) {
            activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("http://play.google.com/store/apps/details?id=" + appPackageName)));
        }
    }

}