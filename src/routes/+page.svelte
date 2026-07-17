<script>
	import { onMount } from 'svelte';
	import { appState, dates, settings } from '$lib/stores/periods.svelte.js';
	import Period from '$lib/components/Period.svelte';

	/** @type {HTMLInputElement | undefined} */
	let fileInput;
	/** @type {{ message: string, type: 'success' | 'error' } | null} */
	let notification = $state(null);

	const weekdays = [
		{ label: 'Pon', value: 1 },
		{ label: 'Wt', value: 2 },
		{ label: 'Śr', value: 3 },
		{ label: 'Czw', value: 4 },
		{ label: 'Pt', value: 5 },
		{ label: 'Sob', value: 6 },
		{ label: 'Niedz', value: 0 }
	];

	/** @param {number} dayValue */
	function toggleRequiredDay(dayValue) {
		if (settings.requiredDays.includes(dayValue)) {
			settings.requiredDays = settings.requiredDays.filter((d) => d !== dayValue);
		} else {
			settings.requiredDays = [...settings.requiredDays, dayValue];
		}
	}

	onMount(() => {
		const saved = localStorage.getItem('appState');
		if (saved) {
			try {
				Object.assign(appState, JSON.parse(saved));
			} catch {
				console.warn('Invalid appState in localStorage');
			}
		}

		const savedSettings = localStorage.getItem('appSettings');
		if (savedSettings) {
			try {
				const parsedSettings = JSON.parse(savedSettings);
				if (Array.isArray(parsedSettings.requiredDays)) {
					settings.requiredDays = parsedSettings.requiredDays;
				}
				if (typeof parsedSettings.minDays === 'number') {
					settings.minDays = parsedSettings.minDays;
				} else if (typeof parsedSettings.requiredPercent === 'number') {
					settings.requiredPercent = parsedSettings.requiredPercent;
				}
			} catch {
				console.warn('Invalid appSettings in localStorage');
			}
		}
	});

	$effect(() => {
		localStorage.setItem('appState', JSON.stringify(appState));
	});

	$effect(() => {
		localStorage.setItem('appSettings', JSON.stringify({
			requiredDays: settings.requiredDays,
			minDays: settings.minDays,
			requiredPercent: settings.requiredPercent
		}));
	});

	/**
	 * @param {string} message
	 * @param {'success' | 'error'} type
	 */
	function showNotification(message, type = 'success') {
		notification = { message, type };
		setTimeout(() => {
			if (notification && notification.message === message) {
				notification = null;
			}
		}, 4000);
	}

	function exportState() {
		try {
			const exportData = {
				appState,
				settings: {
					requiredDays: settings.requiredDays,
					minDays: settings.minDays,
					requiredPercent: settings.requiredPercent
				}
			};
			const dataStr = JSON.stringify(exportData, null, 2);
			const dataBlob = new Blob([dataStr], { type: 'application/json' });
			const url = URL.createObjectURL(dataBlob);
			const link = document.createElement('a');

			link.href = url;
			link.download = `home-office-planner.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			showNotification('Pomyślnie wyeksportowano dane do pliku.', 'success');
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			showNotification('Błąd eksportu: ' + msg, 'error');
		}
	}

	function triggerImport() {
		if (fileInput) {
			fileInput.click();
		}
	}

	/** @param {Event} event */
	function importState(event) {
		const target = /** @type {HTMLInputElement} */ (event.target);
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const fileReaderTarget = /** @type {FileReader} */ (e.target);
				const text = /** @type {string} */ (fileReaderTarget.result);
				const parsed = JSON.parse(text);

				if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
					throw new Error('Zaimportowane dane muszą być poprawnym obiektem JSON.');
				}

				let importedAppState = {};
				let importedSettings = null;

				// Support both wrapper-style structure and old flat layout
				if (parsed.appState && typeof parsed.appState === 'object' && !Array.isArray(parsed.appState)) {
					importedAppState = parsed.appState;
					if (parsed.settings && typeof parsed.settings === 'object') {
						importedSettings = parsed.settings;
					}
				} else {
					importedAppState = parsed;
				}

				const allowedValues = ['b', 'g', 'r'];
				const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

				for (const [key, value] of Object.entries(importedAppState)) {
					if (!dateRegex.test(key)) {
						throw new Error(`Niepoprawny format daty w kluczu: "${key}"`);
					}
					if (!allowedValues.includes(value)) {
						throw new Error(
							`Niepoprawny status dla daty ${key}: "${value}". Dozwolone wartości to: b, g, r`
						);
					}
				}

				// Merge into appState reactively
				Object.assign(appState, importedAppState);

				// Merge settings
				if (importedSettings) {
					if (Array.isArray(importedSettings.requiredDays)) {
						const validDays = [];
						for (const d of importedSettings.requiredDays) {
							if (typeof d === 'number' && d >= 0 && d <= 6) {
								validDays.push(d);
							}
						}
						settings.requiredDays = validDays;
					}
					if (typeof importedSettings.minDays === 'number') {
						settings.minDays = Math.max(1, Math.min(5, importedSettings.minDays));
					} else if (typeof importedSettings.requiredPercent === 'number') {
						// Old configs had requiredPercent where 20% = 1 day, 40% = 2 days, etc.
						const percent = Math.max(0, Math.min(100, importedSettings.requiredPercent));
						settings.minDays = Math.max(1, Math.min(5, Math.round((percent / 100) * 5)));
					}
				}

				showNotification('Pomyślnie zaimportowano i zaktualizowano dane planera.', 'success');
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				showNotification('Błąd podczas importu: ' + msg, 'error');
			} finally {
				target.value = '';
			}
		};
		reader.onerror = () => {
			showNotification('Błąd podczas odczytu pliku.', 'error');
			target.value = '';
		};
		reader.readAsText(file);
	}
</script>

<div class="min-h-screen bg-slate-50 pb-16">
	<!-- Glassmorphic Sticky Header -->
	<header
		class="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/75 backdrop-blur-md transition-all duration-300"
	>
		<div
			class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-6 lg:px-8"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white shadow-md shadow-sky-100"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line
							x1="16"
							y1="2"
							x2="16"
							y2="6"
						/><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg
					>
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-slate-800">Home Office Planner</h1>
					<p class="text-xs font-medium text-slate-400">Zaplanuj swój rok pracy 2026</p>
				</div>
			</div>

			<div class="flex w-full items-center gap-3 sm:w-auto">
				<!-- Import Button -->
				<button
					onclick={triggerImport}
					class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-all duration-200 select-none hover:bg-slate-50 hover:shadow-sm active:scale-[0.98] active:bg-slate-100 sm:flex-initial"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
							points="17 8 12 3 7 8"
						/><line x1="12" x2="12" y1="3" y2="15" /></svg
					>
					Importuj
				</button>

				<!-- Export Button -->
				<button
					onclick={exportState}
					class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-100 transition-all duration-200 select-none hover:from-sky-600 hover:to-indigo-600 hover:shadow-lg hover:shadow-sky-200/50 active:scale-[0.98] active:from-sky-700 active:to-indigo-700 sm:flex-initial"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
							points="7 10 12 15 17 10"
						/><line x1="12" x2="12" y1="15" y2="3" /></svg
					>
					Eksportuj
				</button>

				<input
					type="file"
					accept=".json"
					bind:this={fileInput}
					onchange={importState}
					class="hidden"
				/>
			</div>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="flex flex-col gap-10">
			<!-- Settings Card -->
			<div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
				<div class="flex flex-col gap-2">
					<h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-sky-500" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
						Ustawienia wymagań biura
					</h2>
					<p class="text-xs font-medium text-slate-400">Określ wymagane dni obecności w biurze i minimalny procentowy udział pracy z biura w okresach rozliczeniowych.</p>
				</div>
				
				<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 border-t border-slate-100 pt-6">
					<!-- Required weekdays -->
					<div class="flex flex-col gap-3">
						<span class="text-sm font-semibold text-slate-500">Wymagane dni w biurze:</span>
						<div class="flex flex-wrap gap-2">
							{#each weekdays as day}
								<button
									onclick={() => toggleRequiredDay(day.value)}
									class="px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 cursor-pointer select-none active:scale-95 {settings.requiredDays.includes(day.value) ? 'bg-sky-500 text-white border-sky-500 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
								>
									{day.label}
								</button>
							{/each}
						</div>
					</div>

					<!-- Required Days slider -->
					<div class="flex flex-col gap-3 justify-center">
						<div class="flex justify-between items-center">
							<span class="text-sm font-semibold text-slate-500">Minimalna liczba dni w tygodniu:</span>
							<span class="text-xl font-extrabold text-sky-500">
								{settings.minDays} {settings.minDays === 1 ? 'dzień' : 'dni'}
							</span>
						</div>
						<input
							type="range"
							min="1"
							max="5"
							step="1"
							bind:value={settings.minDays}
							class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-hidden"
						/>
					</div>
				</div>
			</div>

			{#each Object.values(dates) as period, index (index)}
				<div
					class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
				>
					<Period {period} {index} />
				</div>
			{/each}
		</div>
	</main>

	<!-- Elegant Toast Notifications -->
	{#if notification}
		<div
			class="animate-slide-in fixed right-6 bottom-6 z-50 flex max-w-md items-start gap-3.5 rounded-2xl border p-4 shadow-xl backdrop-blur-md {notification.type ===
			'success'
				? 'border-emerald-100 bg-emerald-50/95 text-emerald-900'
				: 'border-rose-100 bg-rose-50/95 text-rose-900'}"
		>
			<div class="mt-0.5">
				{#if notification.type === 'success'}
					<div
						class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg
						>
					</div>
				{:else}
					<div
						class="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg
						>
					</div>
				{/if}
			</div>

			<div class="flex-1 pt-0.5">
				<p class="text-sm leading-relaxed font-semibold">
					{notification.message}
				</p>
			</div>

			<button
				onclick={() => (notification = null)}
				class="cursor-pointer rounded-lg p-1 text-current opacity-40 transition-all hover:bg-black/5 hover:opacity-100"
				aria-label="Zamknij powiadomienie"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg
				>
			</button>
		</div>
	{/if}
</div>

<style>
	@keyframes slide-in {
		from {
			transform: translateY(1rem) scale(0.95);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}
	.animate-slide-in {
		animation: slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
</style>
