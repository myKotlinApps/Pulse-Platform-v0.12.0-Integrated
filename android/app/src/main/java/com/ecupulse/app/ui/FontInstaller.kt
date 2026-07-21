package com.ecupulse.app.ui

import android.content.Context
import android.graphics.Typeface
import android.view.View
import android.view.ViewGroup
import android.widget.TextView

object FontInstaller {
    private fun load(context: Context, name: String): Typeface? = runCatching { context.assets.open("fonts/$name").close(); Typeface.createFromAsset(context.assets,"fonts/$name") }.getOrNull()
    fun apply(root: View) { val regular=load(root.context,"vazirmatn_regular.ttf") ?: return; applyRecursive(root,regular) }
    private fun applyRecursive(v:View,typeface:Typeface){ if(v is TextView && v.typeface?.familyName()?.contains("monospace",true)!=true) v.typeface=typeface; if(v is ViewGroup) for(i in 0 until v.childCount) applyRecursive(v.getChildAt(i),typeface) }
    private fun Typeface.familyName():String = toString()
}
