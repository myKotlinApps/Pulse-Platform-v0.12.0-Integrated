package com.ecupulse.app.ui.theme

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import androidx.core.graphics.ColorUtils
import kotlin.math.*

/**
 * Native reusable panel inspired by the user-supplied EPS sheets.
 * It renders live OBD data without rasterizing the full EPS artwork.
 */
class EpsThemePanelView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()
    private var theme: EpsDashboardTheme = EpsDashboardTheme.NeonAnalytics
    private var speed = 0f
    private var rpm = 0f
    private var coolant = 0f
    private var voltage = 0f
    private var load = 0f
    private var animator: ValueAnimator? = null

    fun setTheme(id: String) {
        theme = EpsDashboardTheme.fromId(id)
        visibility = if (theme.showExtractedPanel) VISIBLE else GONE
        invalidate()
    }

    fun setLive(speedKph: Float, rpmValue: Float, coolantC: Float, voltageValue: Float, engineLoad: Float) {
        val start = speed
        animator?.cancel()
        animator = ValueAnimator.ofFloat(start, speedKph.coerceIn(0f, 220f)).apply {
            duration = 280
            addUpdateListener {
                speed = it.animatedValue as Float
                rpm = rpmValue.coerceIn(0f, 7000f)
                coolant = coolantC.coerceIn(0f, 120f)
                voltage = voltageValue.coerceIn(0f, 16f)
                load = engineLoad.coerceIn(0f, 100f)
                invalidate()
            }
            start()
        }
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val width = MeasureSpec.getSize(widthMeasureSpec)
        val desired = (width * 0.67f).coerceIn(dp(260f), dp(470f)).toInt()
        setMeasuredDimension(width, resolveSize(desired, heightMeasureSpec))
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (!theme.showExtractedPanel) return
        canvas.drawColor(theme.background)
        when (theme) {
            EpsDashboardTheme.NeonAnalytics -> drawNeon(canvas)
            EpsDashboardTheme.ColorMetrics -> drawColor(canvas)
            EpsDashboardTheme.MobileGradient -> drawMobile(canvas)
            EpsDashboardTheme.IndustrialInfographic -> drawIndustrial(canvas)
            else -> Unit
        }
    }

    private fun drawNeon(c: Canvas) {
        roundedPanel(c, 0f, 0f, width.toFloat(), height.toFloat(), theme.panel)
        val topH = height * .55f
        drawLineChart(c, RectF(dp(18f), dp(20f), width * .57f, topH), theme.accent, theme.accent2)
        drawTickDial(c, width * .77f, topH * .52f, min(width, height) * .20f, rpm / 7000f)
        val y = topH + dp(20f)
        val radius = min(width / 9f, (height-y) * .34f)
        val values = listOf(speed / 220f, coolant / 120f, load / 100f, voltage / 16f)
        val colors = listOf(theme.accent, theme.accent2, Color.rgb(181,118,255), Color.rgb(72,255,62))
        values.forEachIndexed { i, value ->
            drawRing(c, width * (.14f + i * .24f), y + radius, radius, value, colors[i], listOf("SPEED","TEMP","LOAD","VOLT")[i])
        }
        drawLabel(c, "NEON ANALYTICS · EPS 6145222", dp(18f), height-dp(15f), theme.muted, dp(11f), Paint.Align.LEFT)
    }

    private fun drawColor(c: Canvas) {
        roundedPanel(c, 0f, 0f, width.toFloat(), height.toFloat(), theme.panel)
        val radius = min(width / 10f, height * .17f)
        val values = listOf(speed/220f, rpm/7000f, coolant/120f, load/100f)
        val colors = listOf(Color.rgb(69,207,255),Color.rgb(32,245,123),Color.rgb(255,188,40),Color.rgb(255,43,122))
        values.forEachIndexed { i,v -> drawFlatDonut(c,width*(.14f+i*.24f),height*.24f,radius,v,colors[i],listOf("SPEED","RPM","TEMP","LOAD")[i]) }
        val baseY = height*.70f
        val barW = (width-dp(44f))/16f
        repeat(16){i ->
            val h = dp(18f)+((i*19+speed+rpm/200f)%76f)/100f*height*.22f
            paint.color=colors[i%4];paint.style=Paint.Style.FILL
            c.drawRoundRect(dp(18f)+i*barW,baseY-h,dp(18f)+i*barW+barW*.62f,baseY,dp(3f),dp(3f),paint)
        }
        drawPolyline(c,RectF(width*.50f,height*.48f,width-dp(18f),height-dp(32f)),theme.text,theme.accent3)
        drawLabel(c,"COLOR METRICS · EPS 6402304",dp(18f),height-dp(12f),theme.muted,dp(11f),Paint.Align.LEFT)
    }

    private fun drawMobile(c: Canvas) {
        val gradient=LinearGradient(0f,0f,width.toFloat(),height.toFloat(),Color.rgb(33,24,76),Color.rgb(35,29,90),Shader.TileMode.CLAMP)
        paint.shader=gradient;paint.style=Paint.Style.FILL;c.drawRoundRect(0f,0f,width.toFloat(),height.toFloat(),dp(22f),dp(22f),paint);paint.shader=null
        val cx=width*.30f;val cy=height*.42f;val r=min(width,height)*.24f
        drawSegmentArc(c,cx,cy,r,rpm/7000f)
        drawLabel(c,rpm.toInt().toString(),cx,cy+dp(12f),Color.rgb(181,44,255),dp(36f),Paint.Align.CENTER,true)
        drawLabel(c,"ENGINE ACTIVITY",cx,cy-dp(24f),Color.WHITE,dp(10f),Paint.Align.CENTER,true)
        val rowX=width*.57f;val rowW=width*.38f;val rowH=(height-dp(55f))/4f
        val rowColors=listOf(Color.rgb(37,57,136),Color.rgb(23,120,172),Color.rgb(24,189,209),Color.rgb(67,236,223))
        val vals=listOf(speed,coolant,load,voltage)
        val names=listOf("SPEED","COOLANT","LOAD","VOLTAGE")
        repeat(4){i ->
            val top=dp(18f)+i*rowH
            paint.color=rowColors[i];paint.style=Paint.Style.FILL;c.drawRoundRect(rowX,top,rowX+rowW,top+rowH-dp(5f),dp(10f),dp(10f),paint)
            drawLabel(c,names[i],rowX+dp(14f),top+dp(22f),Color.WHITE,dp(10f),Paint.Align.LEFT,true)
            drawLabel(c,String.format("%.1f",vals[i]),rowX+dp(14f),top+dp(45f),Color.WHITE,dp(17f),Paint.Align.LEFT,true)
            drawMiniSpark(c,RectF(rowX+rowW*.48f,top+dp(10f),rowX+rowW-dp(10f),top+rowH-dp(12f)),i)
        }
        drawLabel(c,"MOBILE GRADIENT · EPS 5185757",dp(18f),height-dp(12f),theme.muted,dp(11f),Paint.Align.LEFT)
    }

    private fun drawIndustrial(c: Canvas) {
        roundedPanel(c,0f,0f,width.toFloat(),height.toFloat(),theme.panel)
        val radius=min(width/10f,height*.17f)
        val vals=listOf(speed/220f,rpm/7000f,coolant/120f,load/100f)
        val cols=listOf(Color.rgb(211,255,85),Color.rgb(37,239,118),Color.rgb(237,22,80),Color.rgb(255,113,53))
        vals.forEachIndexed{i,v->drawBevelGauge(c,width*(.14f+i*.24f),height*.25f,radius,v,cols[i],listOf("SPEED","RPM","TEMP","LOAD")[i])}
        val meterTop=height*.50f;val meterBottom=height*.86f
        val meterVals=listOf(speed/220f,rpm/7000f,load/100f,coolant/120f,voltage/16f)
        val meterColors=listOf(Color.rgb(211,255,85),Color.rgb(17,108,255),Color.rgb(189,16,255),Color.rgb(237,21,79),Color.rgb(255,118,53))
        repeat(5){i ->
            val x=width*(.12f+i*.18f)
            drawVerticalMeter(c,x,meterTop,meterBottom,meterVals[i],meterColors[i],listOf("S","R","L","T","V")[i])
        }
        drawLabel(c,"INDUSTRIAL INFOGRAPHIC · EPS 2323929",dp(18f),height-dp(12f),theme.muted,dp(11f),Paint.Align.LEFT)
    }

    private fun roundedPanel(c:Canvas,l:Float,t:Float,r:Float,b:Float,color:Int){
        paint.style=Paint.Style.FILL;paint.color=color;c.drawRoundRect(l,t,r,b,dp(22f),dp(22f),paint)
    }
    private fun drawLineChart(c:Canvas,rect:RectF,a:Int,b:Int){
        paint.style=Paint.Style.STROKE;paint.strokeWidth=dp(1f);paint.color=ColorUtils.setAlphaComponent(theme.muted,80)
        repeat(4){i->val y=rect.top+i*rect.height()/3f;c.drawLine(rect.left,y,rect.right,y,paint)}
        path.reset()
        repeat(18){i->val x=rect.left+i*rect.width()/17f;val y=rect.centerY()+sin(i*.72f+rpm/1000f)*rect.height()*.24f+cos(i*.31f)*rect.height()*.08f;if(i==0)path.moveTo(x,y)else path.lineTo(x,y)}
        paint.shader=LinearGradient(rect.left,0f,rect.right,0f,a,b,Shader.TileMode.CLAMP);paint.strokeWidth=dp(3.5f);paint.strokeCap=Paint.Cap.ROUND;c.drawPath(path,paint);paint.shader=null
    }
    private fun drawPolyline(c:Canvas,rect:RectF,a:Int,b:Int){
        path.reset();repeat(12){i->val x=rect.left+i*rect.width()/11f;val y=rect.centerY()+sin(i*.9f+speed/35f)*rect.height()*.26f;if(i==0)path.moveTo(x,y)else path.lineTo(x,y)}
        paint.style=Paint.Style.STROKE;paint.strokeWidth=dp(4f);paint.strokeJoin=Paint.Join.ROUND;paint.shader=LinearGradient(rect.left,0f,rect.right,0f,a,b,Shader.TileMode.CLAMP);c.drawPath(path,paint);paint.shader=null
    }
    private fun drawTickDial(c:Canvas,cx:Float,cy:Float,r:Float,p:Float){
        paint.style=Paint.Style.STROKE;paint.strokeCap=Paint.Cap.BUTT
        repeat(32){i->val ang=Math.toRadians((i*360/32f-90).toDouble());paint.color=ColorUtils.blendARGB(theme.accent3,theme.accent2,i/31f);paint.strokeWidth=dp(4f);val r1=r*.78f;val r2=r*.98f;c.drawLine(cx+cos(ang).toFloat()*r1,cy+sin(ang).toFloat()*r1,cx+cos(ang).toFloat()*r2,cy+sin(ang).toFloat()*r2,paint)}
        drawLabel(c,(p*100).toInt().toString(),cx,cy+dp(10f),theme.accent,dp(30f),Paint.Align.CENTER)
    }
    private fun drawRing(c:Canvas,cx:Float,cy:Float,r:Float,p:Float,color:Int,label:String){
        paint.style=Paint.Style.STROKE;paint.strokeWidth=dp(8f);paint.strokeCap=Paint.Cap.ROUND;paint.color=ColorUtils.setAlphaComponent(theme.muted,70);c.drawCircle(cx,cy,r,paint);paint.color=color;c.drawArc(RectF(cx-r,cy-r,cx+r,cy+r),-90f,p.coerceIn(0f,1f)*360f,false,paint);drawLabel(c,(p*100).toInt().toString(),cx,cy+dp(4f),theme.text,dp(17f),Paint.Align.CENTER);drawLabel(c,label,cx,cy+r+dp(15f),theme.muted,dp(8f),Paint.Align.CENTER)
    }
    private fun drawFlatDonut(c:Canvas,cx:Float,cy:Float,r:Float,p:Float,color:Int,label:String){paint.style=Paint.Style.STROKE;paint.strokeWidth=dp(12f);paint.color=Color.rgb(52,58,101);c.drawCircle(cx,cy,r,paint);paint.color=color;c.drawArc(RectF(cx-r,cy-r,cx+r,cy+r),-90f,p.coerceIn(0f,1f)*360f,false,paint);drawLabel(c,(p*100).toInt().toString(),cx,cy+dp(6f),Color.WHITE,dp(22f),Paint.Align.CENTER);drawLabel(c,label,cx,cy+r+dp(17f),theme.muted,dp(8f),Paint.Align.CENTER)}
    private fun drawSegmentArc(c:Canvas,cx:Float,cy:Float,r:Float,p:Float){paint.style=Paint.Style.STROKE;paint.strokeWidth=dp(8f);paint.strokeCap=Paint.Cap.BUTT;repeat(58){i->val start=135f+i*270f/58f;val active=i/58f<p;paint.color=if(active)ColorUtils.blendARGB(theme.accent,theme.accent2,i/58f)else Color.rgb(54,49,94);c.drawArc(RectF(cx-r,cy-r,cx+r,cy+r),start,2.8f,false,paint)}}
    private fun drawMiniSpark(c:Canvas,rect:RectF,seed:Int){path.reset();repeat(9){i->val x=rect.left+i*rect.width()/8f;val y=rect.centerY()+sin(i*.82f+seed)*rect.height()*.28f;if(i==0)path.moveTo(x,y)else path.lineTo(x,y)};paint.style=Paint.Style.STROKE;paint.strokeWidth=dp(2f);paint.color=ColorUtils.setAlphaComponent(Color.WHITE,210);c.drawPath(path,paint)}
    private fun drawBevelGauge(c:Canvas,cx:Float,cy:Float,r:Float,p:Float,color:Int,label:String){paint.style=Paint.Style.FILL;paint.shader=RadialGradient(cx-r*.2f,cy-r*.3f,r*1.25f,intArrayOf(Color.rgb(90,104,108),Color.rgb(39,52,56),Color.rgb(17,25,28)),null,Shader.TileMode.CLAMP);c.drawCircle(cx,cy,r,paint);paint.shader=null;paint.style=Paint.Style.STROKE;paint.strokeWidth=r*.18f;paint.color=Color.rgb(52,66,71);c.drawCircle(cx,cy,r*.72f,paint);paint.color=color;paint.strokeCap=Paint.Cap.ROUND;c.drawArc(RectF(cx-r*.72f,cy-r*.72f,cx+r*.72f,cy+r*.72f),-95f,p.coerceIn(0f,1f)*330f,false,paint);drawLabel(c,(p*100).toInt().toString()+"%",cx,cy+dp(5f),theme.text,dp(18f),Paint.Align.CENTER);drawLabel(c,label,cx,cy+r+dp(15f),theme.muted,dp(8f),Paint.Align.CENTER)}
    private fun drawVerticalMeter(c:Canvas,x:Float,top:Float,bottom:Float,p:Float,color:Int,label:String){val w=dp(24f);paint.style=Paint.Style.FILL;paint.color=Color.rgb(39,52,57);c.drawRoundRect(x-w/2,top,x+w/2,bottom,w/2,w/2,paint);val h=(bottom-top-dp(10f))*p.coerceIn(.05f,1f);paint.shader=LinearGradient(0f,bottom,0f,bottom-h,Color.YELLOW,color,Shader.TileMode.CLAMP);c.drawRoundRect(x-w*.28f,bottom-dp(5f)-h,x+w*.28f,bottom-dp(5f),w/3,w/3,paint);paint.shader=null;drawLabel(c,label,x,bottom+dp(18f),theme.text,dp(9f),Paint.Align.CENTER)}
    private fun drawLabel(c:Canvas,text:String,x:Float,y:Float,color:Int,size:Float,align:Paint.Align,bold:Boolean=false){paint.style=Paint.Style.FILL;paint.color=color;paint.textSize=size;paint.textAlign=align;paint.typeface=if(bold)Typeface.DEFAULT_BOLD else Typeface.DEFAULT;c.drawText(text,x,y,paint)}
    private fun dp(v:Float)=v*resources.displayMetrics.density
}
