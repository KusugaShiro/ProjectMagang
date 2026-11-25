import { ref } from 'vue'

// Status global untuk mengetahui apakah formulir aktif memiliki perubahan belum disimpan
export const hasActiveUnsavedChanges = ref(false)
// Bendera sementara saat keluar (logout) sudah dikonfirmasi agar tidak muncul konfirmasi ganda
export const bypassUnsavedGuard = ref(false)
