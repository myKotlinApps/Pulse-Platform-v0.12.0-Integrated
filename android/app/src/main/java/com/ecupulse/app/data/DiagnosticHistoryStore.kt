package com.ecupulse.app.data

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class DiagnosticHistoryStore(context: Context) : SQLiteOpenHelper(context, "diagnostics.db", null, 1) {
    override fun onCreate(db: SQLiteDatabase) { db.execSQL("CREATE TABLE events(id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL)") }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit
    fun add(type: String, payload: String) { writableDatabase.execSQL("INSERT INTO events(at,type,payload) VALUES(?,?,?)", arrayOf(System.currentTimeMillis(), type, payload)) }
}
