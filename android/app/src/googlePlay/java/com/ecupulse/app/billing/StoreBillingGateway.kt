package com.ecupulse.app.billing

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.*
import com.android.billingclient.api.BillingResult as PlayBillingResult
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class StoreBillingGateway(context:Context):BillingGateway,PurchasesUpdatedListener {
    override val storeName="googlePlay"
    private val client=BillingClient.newBuilder(context).setListener(this).enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()).build()
    private var pending:CompletableDeferred<BillingResult>?=null
    override suspend fun connect():Result<Unit> = suspendCancellableCoroutine { c -> client.startConnection(object:BillingClientStateListener{override fun onBillingServiceDisconnected(){if(c.isActive)c.resume(Result.failure(IllegalStateException("Google Play disconnected")))};override fun onBillingSetupFinished(r:BillingResult){if(c.isActive)c.resume(if(r.responseCode==BillingClient.BillingResponseCode.OK)Result.success(Unit)else Result.failure(IllegalStateException(r.debugMessage)))}}) }
    override suspend fun products(ids:List<String>):Result<List<BillingProduct>> = runCatching { val params=QueryProductDetailsParams.newBuilder().setProductList(ids.flatMap{id->listOf(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.INAPP).build(),QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.SUBS).build())}).build();val r=client.queryProductDetails(params);r.productDetailsList.orEmpty().map{d->val offer=d.subscriptionOfferDetails?.firstOrNull();BillingProduct(d.productId,d.title,offer?.pricingPhases?.pricingPhaseList?.firstOrNull()?.formattedPrice?:d.oneTimePurchaseOfferDetails?.formattedPrice.orEmpty(),offer?.offerToken)} }
    override suspend fun purchase(activity:Activity,productId:String,offerToken:String?):BillingResult { val details=products(listOf(productId)).getOrElse{return BillingResult.Failure("PRODUCT_QUERY",it.message?:"query failed")};val raw=client.queryProductDetails(QueryProductDetailsParams.newBuilder().setProductList(listOf(QueryProductDetailsParams.Product.newBuilder().setProductId(productId).setProductType(if(offerToken==null)BillingClient.ProductType.INAPP else BillingClient.ProductType.SUBS).build())).build()).productDetailsList?.firstOrNull()?:return BillingResult.Failure("PRODUCT_MISSING","محصول در Google Play پیدا نشد");val p=BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(raw).apply{if(offerToken!=null)setOfferToken(offerToken)}.build();pending=CompletableDeferred();val launch=client.launchBillingFlow(activity,BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(p)).build());if(launch.responseCode!=BillingClient.BillingResponseCode.OK)return BillingResult.Failure("BILLING_${launch.responseCode}",launch.debugMessage);return pending!!.await() }
    override fun onPurchasesUpdated(r:PlayBillingResult,purchases:MutableList<Purchase>?){val out=when(r.responseCode){BillingClient.BillingResponseCode.OK->{val p=purchases?.firstOrNull();if(p==null)BillingResult.Failure("EMPTY_PURCHASE","رسید خرید دریافت نشد")else BillingResult.Success(PurchaseReceipt(storeName,p.products.firstOrNull().orEmpty(),p.purchaseToken,p.originalJson,p.signature,p.isAcknowledged))};BillingClient.BillingResponseCode.USER_CANCELED->BillingResult.Cancelled;else->BillingResult.Failure("BILLING_${r.responseCode}",r.debugMessage)};pending?.complete(out);pending=null}
    override suspend fun restore():Result<List<PurchaseReceipt>> = runCatching { listOf(BillingClient.ProductType.INAPP,BillingClient.ProductType.SUBS).flatMap{type->client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(type).build()).purchasesList.map{PurchaseReceipt(storeName,it.products.firstOrNull().orEmpty(),it.purchaseToken,it.originalJson,it.signature,it.isAcknowledged)}} }
    override fun close(){client.endConnection()}
}
