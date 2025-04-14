package com.example.GarbageMS.models

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val userId: String,
    val email: String,
    val role: String,
    val message: String,
    val success: Boolean
)

data class RegistrationRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String,
    val password: String,
    val username: String,
    val role: String = "USER"
)

data class RegisterResponse(
    val message: String,
    val userId: String
)

data class Timestamp(
    val seconds: Long,
    val nanos: Int
)

data class UserProfile(
    val userId: String?,
    val username: String?,
    val firstName: String,
    val lastName: String,
    val email: String,
    val role: String? = null,
    val location: String? = null,
    val createdAt: Timestamp? = null,
    val preferences: Any? = null
)

data class ProfileUpdateRequest(
    val username: String?,
    val firstName: String,
    val lastName: String,
    val email: String
)

data class PasswordUpdateRequest(
    val oldPassword: String,
    val newPassword: String
)

data class ApiError(
    val error: String
)

// UserSecurityQuestionsResponse has been moved to SecurityQuestion.kt 

data class ProfileResponse(
    val firstName: String?,
    val lastName: String?,
    val phoneNumber: String?,
    val success: Boolean,
    val message: String
) {
    // Secondary constructor for handling error responses
    constructor(success: Boolean, message: String) : this(null, null, null, success, message)
}

data class EmailResponse(
    val email: String?,
    val success: Boolean,
    val message: String
) {
    // Secondary constructor for handling error responses
    constructor(success: Boolean, message: String) : this(null, success, message)
}

data class EmailRequest(
    val email: String
)

data class ProfileRequest(
    val firstName: String,
    val lastName: String,
    val phoneNumber: String?
) 