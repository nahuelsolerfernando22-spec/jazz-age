# =============================================================
# Cuervo Dorado — ProGuard / R8 rules
# =============================================================
# The app is a Capacitor WebView shell. All game code lives in
# JS, so we mainly need to keep the JS <-> Java bridge classes
# intact when minifyEnabled is turned on for release builds.

# Preserve line numbers so Play Console stack traces stay readable.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# --- Capacitor core --------------------------------------------
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.NativePlugin class * { *; }
-keepclasseswithmembers class * {
    @com.getcapacitor.PluginMethod <methods>;
}
-keep class com.getcapacitor.plugin.** { *; }

# Cordova compatibility layer bundled by Capacitor
-keep class org.apache.cordova.** { *; }
-keep interface org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# --- Capacitor community & official plugins we ship ------------
-keep class com.capacitorjs.plugins.** { *; }
-keep class com.capacitorcommunity.** { *; }

# --- Android WebView JS bridge ---------------------------------
# @JavascriptInterface methods must survive shrinking or the
# JS side gets `undefined` at runtime.
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class * extends android.webkit.WebViewClient { *; }
-keep class * extends android.webkit.WebChromeClient { *; }

# --- AndroidX / Splash screen ----------------------------------
-keep class androidx.core.splashscreen.** { *; }
-dontwarn androidx.**

# --- Kotlin coroutines / reflection stubs some plugins pull in -
-dontwarn kotlinx.coroutines.**
-dontwarn kotlin.reflect.jvm.internal.**

# --- Firebase Messaging (only kept if google-services.json exists)
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# --- Reflection-based JSON on the native side ------------------
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin *;
    @com.getcapacitor.PluginMethod *;
}
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Native crash reporters read these fields via reflection.
-keepnames class ** implements java.io.Serializable
-keepclassmembers class ** implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
