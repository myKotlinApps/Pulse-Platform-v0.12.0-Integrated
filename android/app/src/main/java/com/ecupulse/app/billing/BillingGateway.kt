package com.ecupulse.app.billing

import android.app.Activity

data class BillingProduct(val id:String,val title:String,val formattedPrice:String,val offerToken:String?=null)
data class PurchaseReceipt(val store:String,val productId:String,val purchaseToken:String,val originalJson:String,val signature:String?,val acknowledged:Boolean)
sealed interface BillingResult { data class Success(val receipt:PurchaseReceipt):BillingResult; data class Failure(val code:String,val message:String):BillingResult; data object Cancelled:BillingResult }

interface BillingGateway {
    val storeName:String
    suspend fun connect():Result<Unit>
    suspend fun products(ids:List<String>):Result<List<BillingProduct>>
    suspend fun purchase(activity:Activity,productId:String,offerToken:String?=null):BillingResult
    suspend fun restore():Result<List<PurchaseReceipt>>
    fun close()
}
