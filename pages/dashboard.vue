<script setup lang="ts">
import { useAuth } from "~/stores/auth";
import { useRouter } from "vue-router";

const router = useRouter();
const { $api } = useNuxtApp() as any;
const auth = useAuth();
const { $toast } = useNuxtApp() as any;
onMounted(() => auth.user || auth.fetchMe());

const profile = ref<any>(null);
const links = ref<any[]>([]);
const loading = ref(false);
const form = reactive({ title: "", url: "" });
const activeTab = ref("links"); // 'links' or 'profile'
const isSaving = ref(false);
const initialOrder = ref<number[]>([]);
const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);
const imgError = ref(false);
// ADD
const imgTick = ref(0); // pemicu re-render img

const placeholder = "https://via.placeholder.com/96x96?text=%20";
const imgSrc = computed(
  () => avatarPreview.value || profile.value?.avatar_url || placeholder
);
const imgSrcWithTick = computed(() => {
  const base = imgSrc.value || placeholder;

  // JANGAN pasang ?t= untuk blob:/data: URL (preview local)
  if (base.startsWith("blob:") || base.startsWith("data:")) {
    return base;
  }

  // Amanin juga pas SSR
  if (typeof window === "undefined") return base;

  // Tambah cache-buster hanya untuk http/https
  try {
    const u = new URL(base, window.location.origin);
    u.searchParams.set("t", String(imgTick.value));
    return u.toString();
  } catch {
    return base;
  }
});

// OPTIONAL: setiap sumber berubah, paksa refresh
watch([() => profile.value?.avatar_url, avatarPreview], () => {
  imgTick.value++;
});

const avatarUrl = computed(
  () => auth.user?.profile?.avatar_url || profile.value?.avatar_url || null
);
watch(avatarUrl, () => {
  imgError.value = false;
}); // reset kalau ganti foto

const load = async () => {
  loading.value = true;
  profile.value = await $api("/profile");
  links.value = await $api("/links");
  initialOrder.value = links.value.map((l) => l.id);
  loading.value = false;
};
onMounted(load);

const addLink = async () => {
  if (!form.title || !form.url) {
    $toast.info("Isi judul dan URL dulu ya");
    return;
  }
  try {
    const l = await $api("/links", {
      method: "POST",
      body: JSON.stringify(form),
    });
    links.value.push(l);
    form.title = "";
    form.url = "";
    $toast.success("Link ditambahkan");
  } catch (e: any) {
    $toast.error(e?.message || "Gagal menambahkan link");
  }
};

const toggleActive = async (l: any) => {
  const up = await $api(`/links/${l.id}`, {
    method: "PUT",
    body: JSON.stringify({ is_active: !l.is_active }),
  });
  Object.assign(l, up);
};

const removeLink = async (l: any) => {
  await $api(`/links/${l.id}`, { method: "DELETE" });
  links.value = links.value.filter((x) => x.id !== l.id);
};

const saveProfile = async () => {
  if (isSaving.value) return;
  isSaving.value = true;
  try {
    const res = await $api("/profile", {
      method: "PUT",
      body: JSON.stringify(profile.value),
    });
    profile.value = res;
    $toast?.success?.("Profil berhasil disimpan", { timeout: 1500 });
  } catch (e: any) {
    $toast?.error?.(e?.message || "Gagal menyimpan profil");
  } finally {
    isSaving.value = false;
  }
};
const currentOrder = computed(() => links.value.map((l) => l.id));
const isDirty = computed(() => {
  const a = initialOrder.value;
  const b = currentOrder.value;
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return true;
  return false;
});

const reorder = async () => {
  if (!isDirty.value || isSaving.value) return;
  isSaving.value = true;
  try {
    await $api("/links/reorder", {
      method: "POST",
      body: JSON.stringify({ order: currentOrder.value }),
    });
    initialOrder.value = [...currentOrder.value]; // set baseline baru
    $toast?.success?.("Urutan disimpan", { timeout: 1500 });
  } catch (e: any) {
    $toast?.error?.(e?.message || "Gagal menyimpan urutan");
  } finally {
    isSaving.value = false;
  }
};

const loggingOut = ref(false);
const onLogout = async () => {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await auth.logout();
    links.value = [];
    profile.value = null;
    await router.push("/login");
  } finally {
    loggingOut.value = false;
  }
};

const draggedItem = ref<any>(null);
const onDragStart = (e: DragEvent, item: any) => {
  draggedItem.value = item;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
  }
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault();
};

const onDrop = (e: DragEvent, targetItem: any) => {
  e.preventDefault();
  if (!draggedItem.value || draggedItem.value.id === targetItem.id) return;

  const draggedIdx = links.value.findIndex(
    (l) => l.id === draggedItem.value.id
  );
  const targetIdx = links.value.findIndex((l) => l.id === targetItem.id);

  const newLinks = [...links.value];
  newLinks.splice(draggedIdx, 1);
  newLinks.splice(targetIdx, 0, draggedItem.value);

  links.value = newLinks;
  draggedItem.value = null;
};

// Reorder tombol (mobile)
const moveUp = (idx: number) => {
  if (idx <= 0) return;
  const a = [...links.value];
  [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]];
  links.value = a;
};
const moveDown = (idx: number) => {
  if (idx >= links.value.length - 1) return;
  const a = [...links.value];
  [a[idx + 1], a[idx]] = [a[idx], a[idx + 1]];
  links.value = a;
};

const onPickAvatar = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  // validasi ringan
  if (!file.type.startsWith("image/")) {
    $toast?.error?.("File harus gambar (jpg, png, webp, dll)");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    // 2MB
    $toast?.error?.("Maksimal 2MB ya");
    return;
  }
  avatarFile.value = file;

  // preview lokal
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value);
  avatarPreview.value = URL.createObjectURL(file);
  imgTick.value++;
};

// simpan avatar ke server
const uploading = ref(false);
const uploadAvatar = async () => {
  if (!avatarFile.value) return;
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append("avatar", avatarFile.value);
    const res = await $api("/profile/avatar", {
      method: "POST",
      body: fd, // <-- FormData, Content-Type diatur otomatis
    });
    // backend balikin url baru → set ke profile
    profile.value.avatar_url = res.avatar_url;
    $toast?.success?.("Avatar diperbarui");
    // bersihkan preview
    if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value);
    avatarPreview.value = null;
    avatarFile.value = null;
    imgTick.value++;
  } catch (e: any) {
    $toast?.error?.(e?.message || "Gagal upload avatar");
  } finally {
    uploading.value = false;
  }
};

const deletingAvatar = ref(false);

const removeAvatar = async () => {
  if (!profile.value?.avatar_url) return;
  const ok = confirm("Hapus avatar sekarang?");
  if (!ok) return;

  deletingAvatar.value = true;
  try {
    await $api("/profile/avatar", { method: "DELETE" });
    // kosongkan di UI
    profile.value.avatar_url = null;
    // bersihin preview kalau ada
    if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value);
    avatarPreview.value = null;
    avatarFile.value = null;
    imgTick.value++;
    // opsional: sinkronkan juga ke store auth kalau dipakai di header
    if (auth.user) {
      auth.user = {
        ...auth.user,
        profile: { ...(auth.user.profile || {}), avatar_url: null },
      };
    }

    $toast?.success?.("Avatar dihapus");
  } catch (e: any) {
    $toast?.error?.(e?.message || "Gagal menghapus avatar");
  } finally {
    deletingAvatar.value = false;
  }
};
</script>

<template>
  <main
    class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
  >
    <!-- Navbar -->
    <nav
      class="border-b border-white/10 backdrop-blur-xl bg-slate-900/50 sticky top-0 z-50"
    >
      <div class="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14 sm:h-16">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-2 sm:gap-3">
            <div
              v-if="auth.user"
              class="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-slate-700 flex items-center justify-center"
            >
              <!-- pakai foto kalau ada & valid -->
              <img
                v-if="avatarUrl && !imgError"
                :src="avatarUrl"
                :alt="`Avatar ${auth.user.name || ''}`"
                class="w-full h-full object-cover"
                @error="imgError = true"
              />
              <!-- fallback ke inisial -->
              <span v-else class="text-white text-sm font-semibold">
                {{ auth.user.name?.[0]?.toUpperCase() }}
              </span>
            </div>

            <span class="text-base sm:text-xl font-bold text-white">
              {{ auth.user.name }}
            </span>
          </div>

          <!-- User Actions -->
          <div class="flex items-center gap-2 sm:gap-3">
            <NuxtLink
              :to="`/@${profile?.username || ''}`"
              class="sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 text-slate-300 hover:text-white transition-all border border-slate-700/50 text-sm"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span class="hidden lg:inline">View Public</span>
            </NuxtLink>

            <button
              @click="onLogout"
              :disabled="loggingOut"
              class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20 disabled:opacity-50 text-sm"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span class="hidden sm:inline">{{
                loggingOut ? "Logging out..." : "Logout"
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"
        ></div>
      </div>

      <div v-else class="space-y-4 sm:space-y-6">
        <!-- Tab Navigation -->
        <div
          class="flex gap-1 sm:gap-2 p-1 rounded-xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-xl w-full sm:w-fit"
        >
          <button
            @click="activeTab = 'links'"
            :class="[
              'flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all',
              activeTab === 'links'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white',
            ]"
          >
            <div class="flex items-center justify-center gap-1.5 sm:gap-2">
              <svg
                class="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Links
            </div>
          </button>
          <button
            @click="activeTab = 'profile'"
            :class="[
              'flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all',
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white',
            ]"
          >
            <div class="flex items-center justify-center gap-1.5 sm:gap-2">
              <svg
                class="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Profile
            </div>
          </button>
        </div>

        <!-- Links Section -->
        <div v-show="activeTab === 'links'" class="space-y-4 sm:space-y-6">
          <!-- Add Link Card -->
          <div
            class="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-blue-900/30 rounded-xl sm:rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-6"
          >
            <h2
              class="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2"
            >
              <svg
                class="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add New Link
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                v-model="form.title"
                placeholder="Link Title"
                class="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm sm:text-base"
              />
              <input
                v-model="form.url"
                placeholder="https://example.com"
                class="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm sm:text-base"
              />
              <button
                @click="addLink"
                class="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg sm:rounded-xl font-medium transition-all shadow-lg hover:shadow-cyan-500/50 text-sm sm:text-base"
              >
                Add Link
              </button>
            </div>
          </div>

          <!-- Links List -->
          <div
            class="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-blue-900/30 rounded-xl sm:rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-6"
          >
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6"
            >
              <h2
                class="text-lg sm:text-xl font-bold text-white flex items-center gap-2"
              >
                <svg
                  class="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Your Links
                <span class="text-xs sm:text-sm font-normal text-slate-400"
                  >({{ links.length }})</span
                >
              </h2>
              <button
                v-if="links.length"
                @click="reorder"
                :disabled="!isDirty || isSaving"
                class="w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border"
                :class="[
                  isDirty && !isSaving
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/50 text-purple-300 shadow-sm'
                    : 'bg-purple-500/10 border-purple-500/30 text-purple-300/60 cursor-not-allowed',
                ]"
              >
                <span v-if="isSaving">Saving…</span>
                <span v-else>Save Order</span>
              </button>
            </div>

            <div v-if="links.length === 0" class="text-center py-8 sm:py-12">
              <svg
                class="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-3 sm:mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <p class="text-slate-400 text-base sm:text-lg">No links yet</p>
              <p class="text-slate-500 text-xs sm:text-sm mt-2">
                Add your first link above to get started
              </p>
            </div>

            <ul class="space-y-3">
              <li
                v-for="(l, i) in links"
                :key="l.id"
                draggable="true"
                @dragstart="onDragStart($event, l)"
                @dragover="onDragOver"
                @drop="onDrop($event, l)"
                class="group bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/50 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all cursor-default sm:cursor-move"
              >
                <div
                  class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                >
                  <!-- Baris atas (drag, nomor, info) -->
                  <div class="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <!-- Drag Handle -->
                    <div
                      class="hidden sm:flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-700/50 text-slate-400 group-hover:text-slate-300 flex-shrink-0"
                    >
                      <svg
                        class="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                    </div>

                    <!-- Nomor -->
                    <div
                      class="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-xs sm:text-sm font-bold flex-shrink-0"
                    >
                      {{ i + 1 }}
                    </div>

                    <!-- Info link -->
                    <div class="flex-1 min-w-0">
                      <div
                        class="font-semibold text-white text-sm sm:text-base mb-0.5 sm:mb-1 truncate"
                      >
                        {{ l.title }}
                      </div>
                      <a
                        :href="l.url"
                        target="_blank"
                        class="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 truncate block"
                      >
                        {{ l.url }}
                      </a>
                    </div>
                  </div>

                  <!-- Actions: DESKTOP (tetap) -->
                  <div class="hidden sm:flex items-center gap-3">
                    <!-- Toggle -->
                    <label
                      class="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        :checked="l.is_active"
                        @change="toggleActive(l)"
                        class="sr-only peer"
                      />
                      <div
                        class="relative w-11 h-6 rounded-full bg-slate-700 peer-focus:outline-none peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
                      ></div>
                      <span class="ml-3 text-sm font-medium text-slate-400">
                        {{ l.is_active ? "Active" : "Inactive" }}
                      </span>
                    </label>

                    <!-- Delete -->
                    <button
                      @click="removeLink(l)"
                      class="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all"
                      title="Delete link"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Actions: MOBILE (mentok kiri, sejajar drag) -->
                  <div class="sm:hidden flex items-center gap-2 pt-1">
                    <!-- Up / Down (ikon minimal) -->
                    <div class="flex items-center gap-1">
                      <button
                        @click="moveUp(i)"
                        class="h-8 w-8 grid place-items-center rounded-md border border-slate-700/60 bg-slate-800/60 text-slate-200"
                        aria-label="Move up"
                        title="Move up"
                      >
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <button
                        @click="moveDown(i)"
                        class="h-8 w-8 grid place-items-center rounded-md border border-slate-700/60 bg-slate-800/60 text-slate-200"
                        aria-label="Move down"
                        title="Move down"
                      >
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    <!-- Toggle Mobile -->
                    <label
                      class="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        :checked="l.is_active"
                        @change="toggleActive(l)"
                        class="sr-only peer"
                      />
                      <div
                        class="w-9 h-5 sm:w-11 sm:h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"
                      ></div>
                      <span
                        class="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-slate-400"
                      >
                        {{ l.is_active ? "Active" : "Inactive" }}
                      </span>
                    </label>

                    <!-- Delete (tetap di kanan pakai ml-auto) -->
                    <button
                      @click="removeLink(l)"
                      class="ml-auto p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all"
                      title="Delete link"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Profile Section -->
        <div
          v-show="activeTab === 'profile'"
          v-if="profile"
          class="space-y-4 sm:space-y-6"
        >
          <div
            class="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-blue-900/30 rounded-xl sm:rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-6"
          >
            <h2
              class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2"
            >
              <svg
                class="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Public Profile Settings
            </h2>

            <div class="space-y-3 sm:space-y-4">
              <!-- Display Name -->
              <div>
                <label
                  class="block text-slate-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2"
                  >Display Name</label
                >
                <input
                  v-model="profile.display_name"
                  placeholder="Your display name"
                  class="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm sm:text-base"
                />
              </div>

              <!-- Bio -->
              <div>
                <label
                  class="block text-slate-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2"
                  >Bio</label
                >
                <textarea
                  v-model="profile.bio"
                  placeholder="Tell us about yourself..."
                  rows="4"
                  class="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none text-sm sm:text-base"
                ></textarea>
              </div>

              <!-- Avatar URL -->
              <div>
                <label
                  class="block text-slate-300 text-xs sm:text-sm font-medium mb-3 sm:mb-4"
                >
                  Avatar Image
                </label>

                <div
                  class="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50"
                >
                  <!-- Avatar Preview (Left Side) -->
                  <div class="relative group flex-shrink-0">
                    <div
                      class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300"
                      :class="[
                        imgSrcWithTick
                          ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20 group-hover:border-cyan-500 group-hover:shadow-xl group-hover:shadow-cyan-500/30'
                          : 'border-slate-600/50 bg-slate-800/50',
                      ]"
                    >
                      <img
                        v-if="imgSrcWithTick"
                        :key="imgTick"
                        :src="imgSrcWithTick"
                        alt="Avatar"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        @error="
                          () => {
                            profile.avatar_url = null;
                            if (avatarPreview) {
                              URL.revokeObjectURL(avatarPreview);
                              avatarPreview = null;
                            }
                            imgTick++;
                          }
                        "
                      />
                      <div
                        v-else
                        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800"
                      >
                        <svg
                          class="w-10 h-10 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <!-- Upload Controls (Right Side) -->
                  <div class="flex-1 w-full space-y-3">
                    <!-- File Input & Name -->
                    <div class="flex items-center gap-2 sm:gap-3">
                      <label
                        class="group relative px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border-2 border-dashed border-slate-600/50 bg-slate-800/30 text-slate-300 text-sm sm:text-base font-medium cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/50 hover:text-cyan-300 transition-all duration-300 flex items-center gap-2"
                      >
                        <svg
                          class="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        <span class="hidden sm:inline">Choose Image</span>
                        <span class="sm:hidden">Choose</span>
                        <input
                          type="file"
                          accept="image/*"
                          class="hidden"
                          @change="onPickAvatar"
                        />
                      </label>

                      <!-- File Name Display -->
                      <div class="flex-1 min-w-0">
                        <div
                          v-if="avatarFile?.name"
                          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/30"
                        >
                          <svg
                            class="w-4 h-4 text-cyan-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span
                            class="text-slate-300 text-xs sm:text-sm font-medium truncate"
                          >
                            {{ avatarFile.name }}
                          </span>
                        </div>
                        <div v-else class="px-3 py-2">
                          <span class="text-slate-500 text-xs sm:text-sm italic"
                            >No file selected</span
                          >
                        </div>
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <!-- Upload Button -->
                      <button
                        class="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        :class="[
                          !avatarFile || uploading
                            ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 active:scale-95',
                        ]"
                        :disabled="!avatarFile || uploading"
                        @click="uploadAvatar"
                      >
                        <svg
                          v-if="uploading"
                          class="w-4 h-4 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <svg
                          v-else
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span>{{
                          uploading ? "Uploading..." : "Upload Avatar"
                        }}</span>
                      </button>

                      <!-- Delete Button -->
                      <button
                        class="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        :class="[
                          deletingAvatar || !profile?.avatar_url
                            ? 'bg-slate-700/30 border border-slate-700/30 text-slate-500 cursor-not-allowed'
                            : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 active:scale-95',
                        ]"
                        :disabled="deletingAvatar || !profile?.avatar_url"
                        @click="removeAvatar"
                        title="Delete avatar"
                      >
                        <svg
                          v-if="deletingAvatar"
                          class="w-4 h-4 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <svg
                          v-else
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span class="hidden sm:inline">{{
                          deletingAvatar ? "Deleting..." : "Delete Avatar"
                        }}</span>
                        <span class="sm:hidden">{{
                          deletingAvatar ? "Deleting..." : "Delete"
                        }}</span>
                      </button>
                    </div>

                    <!-- Helper Text -->
                    <p class="text-xs text-slate-500 flex items-center gap-1.5">
                      <svg
                        class="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span
                        >Recommended: Square image, max 2MB (JPG, PNG,
                        GIF)</span
                      >
                    </p>
                  </div>
                </div>
              </div>

              <!-- Theme Selection -->
              <div>
                <label
                  class="block text-slate-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2"
                  >Theme</label
                >
                <div class="grid grid-cols-2 gap-2 sm:gap-3">
                  <label
                    v-for="theme in ['light', 'dark', 'minimal', 'neon']"
                    :key="theme"
                    class="relative cursor-pointer"
                  >
                    <input
                      type="radio"
                      v-model="profile.theme"
                      :value="theme"
                      class="sr-only peer"
                    />
                    <div
                      class="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-slate-500/50 peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 hover:border-slate-600/50 transition-all text-center"
                    >
                      <div
                        class="text-white font-medium capitalize text-xs sm:text-base"
                      >
                        {{ theme }}
                      </div>
                      <div
                        v-if="profile.theme === theme"
                        class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2"
                      >
                        <svg
                          class="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Save Button -->
              <button
                @click="saveProfile"
                :disabled="isSaving"
                class="w-full px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg sm:rounded-xl font-medium transition-all shadow-lg hover:shadow-cyan-500/50 text-sm sm:text-base"
              >
                {{ isSaving ? "Saving…" : "Save Profile" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

@media (min-width: 640px) {
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.7);
}

/* Prevent text selection on drag */
li[draggable="true"] {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
