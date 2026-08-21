# ProGuard rules para el APK release de "El Cuervo Dorado".
# Copia este archivo a android/app/proguard-rules.pro DESPUÉS de `bunx cap add android`.

# Capacitor y plugins — no ofuscar, se llaman por reflexión desde JS.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
}

# WebView JS interfaces — se acceden por nombre desde el bundle.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Cordova plugins que Capacitor puentea.
-keep class org.apache.cordova.** { *; }

# Kotlin metadata (por si alguna dep lo trae).
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**

# AndroidX básicos.
-keep class androidx.appcompat.** { *; }
-keep class androidx.core.** { *; }

# Elimina logs en release para no filtrar información.
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Ofusca lo demás (nombres de clases/métodos → aa, bb...).
-obfuscationdictionary proguard-dict.txt
-classobfuscationdictionary proguard-dict.txt
-packageobfuscationdictionary proguard-dict.txt
-repackageclasses ''
-allowaccessmodification
-mergeinterfacesaggressively
-overloadaggressively
