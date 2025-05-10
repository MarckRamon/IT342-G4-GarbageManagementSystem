package com.example.GarbageMS.utils

import android.content.Context
import android.widget.Toast

/**
 * Utility class for displaying toast messages
 */
object ToastUtils {
    /**
     * Show an error toast message
     */
    fun showErrorToast(context: Context, message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    /**
     * Show a success toast message
     */
    fun showSuccessToast(context: Context, message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
} 