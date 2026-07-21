package com.ecupulse.app.billing
import android.app.Activity
import android.content.Context
/** Poolakey is linked only in the CafeBazaar flavor. The public key must be injected by CI and receipts verified by the ECU Pulse server. */
class StoreBillingGateway(private val context:Context):BillingGateway{
 override val storeName="cafebazaar"
 override suspend fun connect()=Result.success(Unit)
 override suspend fun products(ids:List<String>)=Result.success(ids.map{BillingProduct(it,it,"قیمت از بازار دریافت می‌شود")})
 override suspend fun purchase(activity:Activity,productId:String,offerToken:String?)=BillingResult.Failure("BAZAAR_KEY_REQUIRED","کلید RSA بازار را در secret.properties و آداپتور Poolakey تنظیم کنید؛ هیچ کلیدی داخل APK قرار ندهید.")
 override suspend fun restore()=Result.success(emptyList<PurchaseReceipt>())
 override fun close(){}
}
