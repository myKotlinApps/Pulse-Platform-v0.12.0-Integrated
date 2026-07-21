package com.ecupulse.app.ui

import android.content.Context

object BrandLogoResolver {
    private val rules = listOf(
        "parskhodro" to Regex("پارس.?خودرو", RegexOption.IGNORE_CASE),
        "ikcodiesel" to Regex("ایران.?خودرو دیزل", RegexOption.IGNORE_CASE),
        "bahmandiesel" to Regex("بهمن دیزل", RegexOption.IGNORE_CASE),
        "fownix" to Regex("فونیکس|FOWNIX|تیگو 7|تیگو 8|FX", RegexOption.IGNORE_CASE),
        "mvm" to Regex("MVM|X22|X33|X55|آریزو", RegexOption.IGNORE_CASE),
        "modirankhodro" to Regex("مدیران خودرو", RegexOption.IGNORE_CASE),
        "kmc" to Regex("KMC", RegexOption.IGNORE_CASE),
        "jac" to Regex("جک|JAC", RegexOption.IGNORE_CASE),
        "kermanmotor" to Regex("کرمان موتور", RegexOption.IGNORE_CASE),
        "lamari" to Regex("آرین پارس|لاماری", RegexOption.IGNORE_CASE),
        "farda" to Regex("فردا موتور|FMC|SUBA", RegexOption.IGNORE_CASE),
        "diar" to Regex("دیار خودرو", RegexOption.IGNORE_CASE),
        "mammut" to Regex("ماموت خودرو", RegexOption.IGNORE_CASE),
        "zamyad" to Regex("زامیاد|پادرا|کارون", RegexOption.IGNORE_CASE),
        "bahman" to Regex("بهمن موتور|فیدلیتی|دیگنیتی|ریسپکت|کاپرا", RegexOption.IGNORE_CASE),
        "ikco" to Regex("ایران.?خودرو|رانا|سمند|سورن|دنا|تارا|ری.?را", RegexOption.IGNORE_CASE),
        "saipa" to Regex("سایپا|پراید|تیبا|ساینا|کوییک|اطلس|شاهین", RegexOption.IGNORE_CASE),
        "mini" to Regex("MINI", RegexOption.IGNORE_CASE),
        "lexus" to Regex("لکسوس|RX|NX", RegexOption.IGNORE_CASE),
        "audi" to Regex("آئودی|Audi|A3|A4|Q5", RegexOption.IGNORE_CASE),
        "skoda" to Regex("اشکودا|اوکتاویا", RegexOption.IGNORE_CASE),
        "citroen" to Regex("سیتروئن|C3|C5", RegexOption.IGNORE_CASE),
        "peugeot" to Regex("پژو|Peugeot|۲۰۶|۲۰۷|۳۰۱|۲۰۰۸", RegexOption.IGNORE_CASE),
        "mercedesbenz" to Regex("مرسدس|بنز|Axor|Actros|Atego", RegexOption.IGNORE_CASE),
        "isuzu" to Regex("ایسوزو|Isuzu", RegexOption.IGNORE_CASE),
        "mazda" to Regex("مزدا|Mazda", RegexOption.IGNORE_CASE),
        "renault" to Regex("رنو|Renault|لوگان|ساندرو|داستر|کپچر|تندر|مگان", RegexOption.IGNORE_CASE),
        "toyota" to Regex("تویوتا|Toyota|کرولا|کمری|پریوس|RAV4|لندکروزر|هایلوکس", RegexOption.IGNORE_CASE),
        "bmw" to Regex("BMW|ب.?ام.?و", RegexOption.IGNORE_CASE),
        "volvotrucks" to Regex("ولوو تراکس|FH|FMX", RegexOption.IGNORE_CASE),
        "volvo" to Regex("ولوو|Volvo", RegexOption.IGNORE_CASE),
        "hyundaicommercial" to Regex("هیوندای تجاری|HD65|HD78|Xcient", RegexOption.IGNORE_CASE),
        "hyundai" to Regex("هیوندای|Hyundai|اکسنت|النترا|سوناتا|آزرا|توسان|سانتافه", RegexOption.IGNORE_CASE),
        "kia" to Regex("کیا|Kia|ریو|سراتو|اپتیما|اسپورتیج|سورنتو", RegexOption.IGNORE_CASE),
        "nissan" to Regex("نیسان|Nissan|ماکسیما|مورانو|قشقایی|جوک|تیانا", RegexOption.IGNORE_CASE),
        "mitsubishi" to Regex("میتسوبیشی|Mitsubishi|لنسر|اوتلندر|پاجرو", RegexOption.IGNORE_CASE),
        "honda" to Regex("هوندا|Honda|سیویک|آکورد", RegexOption.IGNORE_CASE),
        "suzuki" to Regex("سوزوکی|Suzuki|ویتارا", RegexOption.IGNORE_CASE),
        "volkswagen" to Regex("فولکس|Volkswagen|گلف|پاسات|تیگوان", RegexOption.IGNORE_CASE),
        "opel" to Regex("اوپل|Opel|آسترا|کورسا", RegexOption.IGNORE_CASE),
        "scania" to Regex("اسکانیا|Scania", RegexOption.IGNORE_CASE),
        "iveco" to Regex("ایویکو|Iveco", RegexOption.IGNORE_CASE),
        "daf" to Regex("داف|DAF", RegexOption.IGNORE_CASE),
        "man" to Regex("(^|\s)مان(\s|$)|MAN|TGX|TGS", setOf(RegexOption.IGNORE_CASE)),
        "foton" to Regex("فوتون|آومان|Foton|Auman", RegexOption.IGNORE_CASE),
        "faw" to Regex("فاو|FAW", RegexOption.IGNORE_CASE),
        "dongfeng" to Regex("دانگ.?فنگ|Dongfeng", RegexOption.IGNORE_CASE),
        "geely" to Regex("جیلی|Geely", RegexOption.IGNORE_CASE),
        "byd" to Regex("BYD", RegexOption.IGNORE_CASE),
        "mg" to Regex("(^|\s)MG", RegexOption.IGNORE_CASE),
        "brilliance" to Regex("برلیانس|Brilliance", RegexOption.IGNORE_CASE),
        "haval" to Regex("هاوال|Haval", RegexOption.IGNORE_CASE),
        "changan" to Regex("چانگان|Changan", RegexOption.IGNORE_CASE),
        "greatwall" to Regex("گریت.?وال|وینگل|Great Wall", RegexOption.IGNORE_CASE),
        "baic" to Regex("BAIC", RegexOption.IGNORE_CASE)
    )
    fun assetPath(context: Context, make: String, model: String, explicit: String? = null): String {
        if (!explicit.isNullOrBlank() && exists(context, explicit)) return explicit
        val text = "$make $model"
        val key = rules.firstOrNull { it.second.containsMatchIn(text) }?.first ?: "generic"
        val officialV120 = "logos/${key}-official-v120.png"
        val verifiedV110 = "logos/${key}-verified-v110.png"
        val png = "logos/$key.png"
        val svg = "logos/$key.svg"
        return when {
            exists(context, officialV120) -> officialV120
            exists(context, verifiedV110) -> verifiedV110
            exists(context, png) -> png
            exists(context, svg) -> svg
            else -> "logos/fallback/$key.svg".takeIf { exists(context, it) } ?: "logos/fallback/generic.svg"
        }
    }

    private fun exists(context: Context, path: String): Boolean = runCatching { context.assets.open(path).close(); true }.getOrDefault(false)
}
