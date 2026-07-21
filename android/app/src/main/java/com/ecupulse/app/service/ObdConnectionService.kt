package com.ecupulse.app.service

import android.app.*
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.ecupulse.app.MainActivity
import com.ecupulse.app.R

class ObdConnectionService : Service() {
    override fun onCreate(){super.onCreate(); if(Build.VERSION.SDK_INT>=26)getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel(CHANNEL,"اتصال ECU",NotificationManager.IMPORTANCE_LOW))}
    override fun onStartCommand(intent:Intent?,flags:Int,startId:Int):Int{ val pi=PendingIntent.getActivity(this,0,Intent(this,MainActivity::class.java),PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT); val n=NotificationCompat.Builder(this,CHANNEL).setSmallIcon(android.R.drawable.stat_sys_data_bluetooth).setContentTitle("ECU Pulse متصل است").setContentText("ارتباط با ماژول OBD فعال است").setOngoing(true).setContentIntent(pi).build(); startForeground(1001,n); return START_NOT_STICKY }
    override fun onBind(intent:Intent?)=null
    companion object{const val CHANNEL="obd_connection"}
}
