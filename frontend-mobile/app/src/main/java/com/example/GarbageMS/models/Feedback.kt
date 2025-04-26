package com.example.GarbageMS.models

data class Feedback(
    val feedbackId: String = "",
    val title: String = "",
    val description: String = "",
    val status: String = "PENDING",
    val userId: String = "",
    val userEmail: String = "",
    val createdAt: String? = null,
    val updatedAt: String? = null
) 