package com.ecupulse.app.billing
import android.app.Activity
import android.content.Context
/** Myket uses its IAB service. The AIDL/public key integration is isolated in this flavor and server verification remains mandatory. */
class StoreBillingGateway(private val context:Context):BillingGateway{
 override val storeName="myket"
 override suspend fun connect()=Result.success(Unit)
 override suspend fun products(ids:List<String>)=Result.success(ids.map{BillingProduct(it,it,"قیمت از مایکت دریافت می‌شود")})
 override suspend fun purchase(activity:Activity,productId:String,offerToken:String?)=BillingResult.Failure("MYKET_KEY_REQUIRED","کلید عمومی و IAB Helper مایکت را در Flavor مایکت تنظیم کنید؛ رسید باید سمت سرور تأیید شود.")
 override suspend fun restore()=Result.success(emptyList<PurchaseReceipt>())
 override fun close(){}
}
