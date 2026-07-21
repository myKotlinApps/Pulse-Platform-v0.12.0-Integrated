package com.ecupulse.app.ui

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import coil3.load
import kotlin.math.*

/** Uses the SVG gauge faces extracted from the supplied EPS and overlays a native animated needle/value. */
class GaugeView @JvmOverloads constructor(context: Context, attrs: AttributeSet?=null): FrameLayout(context,attrs) {
    private val face = ImageView(context).apply { scaleType = ImageView.ScaleType.FIT_CENTER }
    private val overlay = NeedleOverlay(context)
    private var maxValue = 220f
    private var unit = "km/h"

    init {
        addView(face, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        addView(overlay, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    fun configure(maxValue:Float, unit:String){
        this.maxValue=maxValue;this.unit=unit
        overlay.configure(maxValue,unit)
        val asset = if(unit.equals("rpm",true)) "tachometer-face.svg" else "speedometer-face.svg"
        face.load("file:///android_asset/gauges/$asset")
    }
    fun setValue(v:Float){overlay.setValue(v)}

    private class NeedleOverlay(context: Context): View(context) {
        private val paint=Paint(Paint.ANTI_ALIAS_FLAG)
        private var value=0f; private var max=220f; private var label="km/h"; private var animator:ValueAnimator?=null
        fun configure(maxValue:Float,unit:String){max=maxValue;label=unit;invalidate()}
        fun setValue(v:Float){
            val target=v.coerceIn(0f,max);animator?.cancel();animator=ValueAnimator.ofFloat(value,target).apply{
                duration=380;addUpdateListener{value=it.animatedValue as Float;invalidate()};start()
            }
        }
        override fun onDraw(c:Canvas){super.onDraw(c)
            val scale=min(width/220f,height/180f);val ox=(width-220*scale)/2f;val oy=(height-180*scale)/2f
            val cx=ox+110*scale;val cy=oy+122*scale;val r=54*scale
            val start=200f;val end=340f;val angle=Math.toRadians((start+(end-start)*(value/max)).toDouble())
            paint.style=Paint.Style.STROKE;paint.strokeCap=Paint.Cap.ROUND;paint.strokeWidth=maxOf(3f,7*scale);paint.color=Color.WHITE
            c.drawLine(cx,cy,cx+cos(angle).toFloat()*r,cy+sin(angle).toFloat()*r,paint)
            paint.strokeWidth=maxOf(1.5f,2.5f*scale);paint.color=Color.rgb(200,208,214)
            c.drawLine(cx+cos(angle).toFloat()*7*scale,cy+sin(angle).toFloat()*7*scale,cx+cos(angle).toFloat()*r,cy+sin(angle).toFloat()*r,paint)
            paint.style=Paint.Style.FILL;paint.color=Color.rgb(243,245,246);c.drawCircle(cx,cy,15*scale,paint);paint.color=Color.rgb(200,208,214);c.drawCircle(cx,cy,9*scale,paint);paint.color=Color.rgb(82,187,255);c.drawCircle(cx,cy,5*scale,paint)
            paint.textAlign=Paint.Align.CENTER;paint.typeface=Typeface.DEFAULT_BOLD;paint.textSize=16*scale;paint.color=Color.WHITE
            val display=if(label=="rpm") value.roundToInt().toString() else value.roundToInt().toString();c.drawText(display,cx,oy+166*scale,paint)
        }
    }
}
