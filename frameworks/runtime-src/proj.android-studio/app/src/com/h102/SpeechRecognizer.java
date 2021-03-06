package com.h102;

import android.os.AsyncTask;
import android.util.Log;
import android.widget.Toast;

import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.concurrent.Executors;

import edu.cmu.pocketsphinx.Assets;
import edu.cmu.pocketsphinx.Hypothesis;
import edu.cmu.pocketsphinx.RecognitionListener;

import static android.widget.Toast.makeText;
import static edu.cmu.pocketsphinx.SpeechRecognizerSetup.defaultSetup;

/**
 * Created by nick on 12/11/15.
 */
public class SpeechRecognizer implements RecognitionListener {

    private static final String TAG = SpeechRecognizer.class.getSimpleName();

    private static SpeechRecognizer mSharedInstance = null;
    private static AppActivity app;

    edu.cmu.pocketsphinx.SpeechRecognizer recognizer;
    private JSGFGrammarBuilder grammarBuilder;
    private File externalDir = null;
    private boolean bInitilized = false;

    private static ArrayList<String> cachedArrayList = null;
    private static String languageCode = "en";

    Runnable setupCallback = null;

    private static final String TSOG_SEARCH = "tsog";

    public synchronized static SpeechRecognizer setupInstance(AppActivity app) {
        if (mSharedInstance == null) {
            SpeechRecognizer.app = app;
            return getInstance();
        }

        return mSharedInstance;
    }

    public static SpeechRecognizer getInstance() {
        synchronized (SpeechRecognizer.class) {
            if (mSharedInstance == null || (mSharedInstance.recognizer == null && mSharedInstance.bInitilized)) {
                mSharedInstance = new SpeechRecognizer();
            }

            return mSharedInstance;
        }
    }

    private SpeechRecognizer() {
        SpeechRecognizerSettingUp task = new SpeechRecognizerSettingUp(languageCode);
        task.execute();
    }

    public void start() {
        recognizer.stop();
        recognizer.startListening(TSOG_SEARCH);
    }

    public void stop() {
        recognizer.stop();
    }

    public void shutdown() {
        recognizer.shutdown();
    }

    @Override
    public void onBeginningOfSpeech() {

    }

    @Override
    public void onEndOfSpeech() {

    }

    @Override
    public void onPartialResult(Hypothesis hypothesis) {
        if (hypothesis == null)
            return;

        Log.w(TAG, hypothesis.getHypstr() + " " + hypothesis.getProb() + " " + hypothesis.getBestScore());

        final String commandForm = "SpeechRecognitionListener.getInstance().onPartialResult('%s')";
        final String text = hypothesis.getHypstr().toUpperCase();
        app.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString(String.format(commandForm, text));
            }
        });
    }

    @Override
    public void onResult(Hypothesis hypothesis) {
        final String commandForm = "SpeechRecognitionListener.getInstance().onResult('%s')";
        final String text = hypothesis == null ? "" : hypothesis.getHypstr().toUpperCase();

//        if (hypothesis != null) {
//            app.runOnUiThread(new Runnable() {
//                @Override
//                public void run() {
//                    makeText(app.getApplicationContext(), text, Toast.LENGTH_SHORT).show();
//                }
//            });
//        }

//        Log.w(TAG, "Final: " + hypothesis.getHypstr() + " " + hypothesis.getProb() + " " + hypothesis.getBestScore());


        app.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString(String.format(commandForm, text));
            }
        });
    }

    @Override
    public void onError(Exception e) {
        final String commandForm = "SpeechRecognitionListener.getInstance().onError('%s')";
        final String message = e.getLocalizedMessage();
        app.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString(String.format(commandForm, message));
            }
        });
    }

    @Override
    public void onTimeout() {
        recognizer.stop();
    }

    @Override
    public void onReceivedMaxAmplitude(int amplitude) {

    }

    void updateNewLanguageArray(String languageCode, ArrayList<String> arrayList) throws IOException {
        if (grammarBuilder == null) {
            SpeechRecognizer.languageCode = languageCode;
            cachedArrayList = new ArrayList<>(arrayList);
            return;
        }

        if (languageCode.compareTo(SpeechRecognizer.languageCode) != 0) {
            SpeechRecognizer.languageCode = languageCode;
            cachedArrayList = new ArrayList<>(arrayList);

            SpeechRecognizerSettingUp task = new SpeechRecognizerSettingUp(languageCode);
            task.execute();

            return;
        }

        grammarBuilder.reset();

        for(String s : arrayList) {
            grammarBuilder.add(s);
        }
        grammarBuilder.saveGrammar();
        File tsogGrammar = new File(externalDir, "tsog.gram");
        recognizer.addGrammarSearch(TSOG_SEARCH, tsogGrammar);

        cachedArrayList = null;
    }

    private class SpeechRecognizerSettingUp extends AsyncTask<Void, Void, Exception> {

        private final String language;

        private SpeechRecognizerSettingUp(String language) {
            this.language = language;
        }

        @Override
        protected Exception doInBackground(Void... params) {
            try {
                Assets assets = new Assets(app);
                File assetDir = assets.syncAssets();
                setupRecognizer(language, assetDir);
            } catch (IOException e) {
                return e;
            }
            return null;
        }

        @Override
        protected void onPostExecute(Exception result) {
            if (result != null)
                result.printStackTrace();

            if (cachedArrayList != null)
                try {
                    updateNewLanguageArray(languageCode, cachedArrayList);
                } catch (IOException e) {
                    e.printStackTrace();
                }

            if (setupCallback != null) {
                Executors.newSingleThreadExecutor().execute(setupCallback);
                setupCallback = null;
            }

//                String commandForm = "SpeechRecognitionListener.getInstance().onSetupComplete(%b, '%s')";
//                if (result == null) {
//                    Cocos2dxJavascriptJavaBridge.evalString(String.format(commandForm, true, ""));
//                } else {
//                    Cocos2dxJavascriptJavaBridge.evalString(String.format(commandForm, false, result.getLocalizedMessage()));
//                }

//                if (result != null) {
//                    ((TextView) findViewById(R.id.caption_text))
//                            .setText("Failed to init recognizer " + result);
//                } else {
//                    switchSearch(KWS_SEARCH);
//                }
            bInitilized = true;
        }

        private void setupRecognizer(String language, File assetsDir) throws IOException {
            // The recognizer can be configured to perform multiple searches
            // of different kind and switch between them

            externalDir = assetsDir;

            recognizer = defaultSetup()
                    .setAcousticModel(new File(assetsDir, language))
                    .setDictionary(new File(assetsDir, language + ".dict"))

                    // To disable logging of raw audio comment out this call (takes a lot of space on the device)
                    .setRawLogDir(assetsDir)

                    // Threshold to tune for keyphrase to balance between false alarms and misses
                    .setKeywordThreshold(1e-45f)

                    // Use context-independent phonetic search, context-dependent is too slow for mobile
                    .setBoolean("-allphone_ci", true)

                    .getRecognizer();
            recognizer.addListener(SpeechRecognizer.this);

            /** In your application you might not need to add all those searches.
             * They are added here for demonstration. You can leave just one.
             */

            // Create keyword-activation search.
//        recognizer.addKeyphraseSearch(KWS_SEARCH, KEYPHRASE);
//
//        // Create grammar-based search for selection between demos
//        File tsogGrammar = new File(assetsDir, "tsog.gram");
//        recognizer.addGrammarSearch(TSOG_SEARCH, tsogGrammar);
//
//        // Create grammar-based search for digit recognition
//        File digitsGrammar = new File(assetsDir, "digits.gram");
//        recognizer.addGrammarSearch(DIGITS_SEARCH, digitsGrammar);
//
//        // Create language model search
//        File languageModel = new File(assetsDir, "weather.dmp");
//        recognizer.addNgramSearch(FORECAST_SEARCH, languageModel);
//
//        // Phonetic search
//        File phoneticModel = new File(assetsDir, "en-phone.dmp");
//        recognizer.addAllphoneSearch(PHONE_SEARCH, phoneticModel);

            grammarBuilder = new JSGFGrammarBuilder(assetsDir);
        }
    }
}
