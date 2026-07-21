package com.ecupulse.app.ui.theme

import android.graphics.Color

sealed class EpsDashboardTheme(
    val id: String,
    val titleFa: String,
    val background: Int,
    val panel: Int,
    val text: Int,
    val muted: Int,
    val accent: Int,
    val accent2: Int,
    val accent3: Int,
    val lightSystemBars: Boolean,
    val showExtractedPanel: Boolean
) {
    object Dark : EpsDashboardTheme("dark","سیاه",Color.rgb(7,17,31),Color.rgb(14,33,53),Color.WHITE,Color.rgb(142,160,181),Color.rgb(85,223,246),Color.rgb(60,166,255),Color.rgb(85,217,154),false,false)
    object Ivory : EpsDashboardTheme("ivory","سفید شیری",Color.rgb(245,240,230),Color.rgb(255,250,241),Color.rgb(29,39,49),Color.rgb(110,119,129),Color.rgb(4,127,156),Color.rgb(22,117,189),Color.rgb(33,136,92),true,false)
    object MyDiag : EpsDashboardTheme("mydiag","MyDiag آبی",Color.rgb(238,244,250),Color.WHITE,Color.rgb(25,50,74),Color.rgb(111,132,152),Color.rgb(21,123,211),Color.rgb(26,168,239),Color.rgb(43,189,135),true,false)
    object NeonAnalytics : EpsDashboardTheme("eps-neon","EPS نئون آماری",Color.rgb(16,11,61),Color.rgb(21,16,74),Color.WHITE,Color.rgb(158,147,214),Color.rgb(37,234,214),Color.rgb(255,45,181),Color.rgb(34,105,255),false,true)
    object ColorMetrics : EpsDashboardTheme("eps-color","EPS رنگی متریک",Color.rgb(8,5,43),Color.rgb(17,16,56),Color.WHITE,Color.rgb(167,167,197),Color.rgb(32,245,123),Color.rgb(255,43,122),Color.rgb(69,207,255),false,true)
    object MobileGradient : EpsDashboardTheme("eps-mobile","EPS موبایل گرادیانی",Color.rgb(23,17,51),Color.rgb(33,24,76),Color.WHITE,Color.rgb(178,174,209),Color.rgb(87,239,255),Color.rgb(181,44,255),Color.rgb(79,83,237),false,true)
    object IndustrialInfographic : EpsDashboardTheme("eps-industrial","EPS صنعتی",Color.rgb(18,26,30),Color.rgb(26,38,42),Color.rgb(232,240,241),Color.rgb(141,155,159),Color.rgb(211,255,85),Color.rgb(37,239,118),Color.rgb(17,108,255),false,true)
    companion object {
        val all = listOf(Dark, Ivory, MyDiag, NeonAnalytics, ColorMetrics, MobileGradient, IndustrialInfographic)
        fun fromId(id: String?) = all.firstOrNull { it.id == id } ?: MyDiag
    }
}
