package com.ecupulse.app.trip

import android.Manifest
import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

class TripTrackingService : Service(), LocationListener {
    companion object { const val ACTION_START="com.ecupulse.trip.START"; const val ACTION_STOP="com.ecupulse.trip.STOP"; private const val CHANNEL="trip_tracking" }
    private lateinit var manager: LocationManager
    private val points=JSONArray(); private var startedAt=0L; private var saved=false
    override fun onCreate(){super.onCreate();manager=getSystemService(Context.LOCATION_SERVICE) as LocationManager;createChannel()}
    override fun onStartCommand(intent:Intent?,flags:Int,startId:Int):Int { when(intent?.action){ACTION_STOP->{finishTrip();stopSelf()};else->startTracking()};return START_NOT_STICKY }
    private fun startTracking(){saved=false;startForeground(2402,NotificationCompat.Builder(this,CHANNEL).setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentTitle("ECU Pulse").setContentText("در حال ثبت مسیر سفر").setOngoing(true).build());startedAt=System.currentTimeMillis();points.clear();if(ContextCompat.checkSelfPermission(this,Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED&&ContextCompat.checkSelfPermission(this,Manifest.permission.ACCESS_COARSE_LOCATION)!=PackageManager.PERMISSION_GRANTED){stopSelf();return};runCatching{manager.requestLocationUpdates(LocationManager.GPS_PROVIDER,3000L,5f,this)};runCatching{manager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER,5000L,15f,this)}}
    override fun onLocationChanged(l:Location){if(l.accuracy>120)return;points.put(JSONObject().put("latitude",l.latitude).put("longitude",l.longitude).put("timestamp",l.time).put("speedKph",(l.speed*3.6f).coerceAtLeast(0f)).put("accuracyMeters",l.accuracy))}
    private fun finishTrip(){if(saved)return;runCatching{manager.removeUpdates(this)};if(points.length()<2)return;saved=true;val obj=JSONObject().put("id",UUID.randomUUID().toString()).put("titleFa","سفر ثبت‌شده Android").put("startedAt",startedAt).put("endedAt",System.currentTimeMillis()).put("points",points);getSharedPreferences("trip_tracking",MODE_PRIVATE).edit().putString("last_trip",obj.toString()).apply()}
    private fun createChannel(){if(Build.VERSION.SDK_INT>=26)(getSystemService(NotificationManager::class.java)).createNotificationChannel(NotificationChannel(CHANNEL,"ثبت سفر",NotificationManager.IMPORTANCE_LOW))}
    override fun onBind(intent:Intent?)=null
    override fun onProviderEnabled(provider:String){};override fun onProviderDisabled(provider:String){};@Deprecated("Deprecated") override fun onStatusChanged(provider:String?,status:Int,extras:Bundle?){}
    override fun onDestroy(){finishTrip();runCatching{manager.removeUpdates(this)};super.onDestroy()}
}
