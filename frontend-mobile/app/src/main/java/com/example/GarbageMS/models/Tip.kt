package com.example.GarbageMS.models

import com.google.gson.annotations.SerializedName

data class Tip(
    @SerializedName("tipId") val tipId: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("description") val description: String = "",
    @SerializedName("status") val status: String = "",
    @SerializedName("userId") val userId: String = "",
    @SerializedName("userEmail") val userEmail: String = "",
    @SerializedName("createdAt") val createdAt: String = "",
    @SerializedName("updatedAt") val updatedAt: String = ""
) 