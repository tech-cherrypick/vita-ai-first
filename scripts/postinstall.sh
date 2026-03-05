#!/bin/bash
for f in $(find node_modules/@capacitor -name "build.gradle" 2>/dev/null); do
  if grep -q "proguard-android.txt" "$f"; then
    sed -i '' "s/getDefaultProguardFile('proguard-android.txt')/getDefaultProguardFile('proguard-android-optimize.txt')/" "$f"
  fi
done

PREF_GRADLE="node_modules/@capacitor/preferences/android/build.gradle"
if [ -f "$PREF_GRADLE" ] && grep -q "proguard-android.txt" "$PREF_GRADLE"; then
  sed -i '' "s/getDefaultProguardFile('proguard-android.txt')/getDefaultProguardFile('proguard-android-optimize.txt')/" "$PREF_GRADLE"
fi

echo "postinstall: proguard fixes applied"

