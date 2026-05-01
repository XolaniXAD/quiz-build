<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>QuizMaster - Edit Quiz</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "secondary-fixed": "#d3e4fe",
                    "primary-fixed-dim": "#b4c5ff",
                    "on-secondary-container": "#54647a",
                    "on-primary-fixed-variant": "#003ea7",
                    "primary-fixed": "#dbe1ff",
                    "on-primary-container": "#eeefff",
                    "primary-container": "#2463eb",
                    "secondary-container": "#d0e1fb",
                    "tertiary": "#006242",
                    "on-secondary": "#ffffff",
                    "inverse-primary": "#b4c5ff",
                    "secondary-fixed-dim": "#b7c8e1",
                    "secondary": "#505f76",
                    "surface-container-high": "#e2e7ff",
                    "on-background": "#131b2e",
                    "surface-container-low": "#f2f3ff",
                    "on-tertiary-fixed-variant": "#005236",
                    "surface-dim": "#d2d9f4",
                    "tertiary-container": "#007d55",
                    "inverse-on-surface": "#eef0ff",
                    "on-tertiary-fixed": "#002113",
                    "on-surface": "#131b2e",
                    "on-error-container": "#93000a",
                    "on-primary-fixed": "#00174b",
                    "outline-variant": "#c3c6d7",
                    "on-tertiary": "#ffffff",
                    "surface-container": "#eaedff",
                    "on-secondary-fixed": "#0b1c30",
                    "tertiary-fixed": "#6ffbbe",
                    "on-surface-variant": "#434655",
                    "on-tertiary-container": "#bdffdb",
                    "tertiary-fixed-dim": "#4edea3",
                    "surface-tint": "#0053da",
                    "outline": "#737686",
                    "error-container": "#ffdad6",
                    "surface": "#faf8ff",
                    "inverse-surface": "#283044",
                    "on-primary": "#ffffff",
                    "surface-container-lowest": "#ffffff",
                    "primary": "#004bc6",
                    "on-secondary-fixed-variant": "#38485d",
                    "surface-container-highest": "#dae2fd",
                    "error": "#ba1a1a",
                    "surface-bright": "#faf8ff",
                    "on-error": "#ffffff",
                    "background": "#faf8ff",
                    "surface-variant": "#dae2fd"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "xs": "4px",
                    "gutter": "20px",
                    "lg": "24px",
                    "container-max": "1280px",
                    "xl": "48px",
                    "sm": "8px",
                    "unit": "4px",
                    "md": "16px"
            },
            "fontFamily": {
                    "body-md": ["Inter"],
                    "headline-sm": ["Inter"],
                    "code-sm": ["monospace"],
                    "display-lg": ["Inter"],
                    "headline-md": ["Inter"],
                    "label-md": ["Inter"],
                    "body-lg": ["Inter"]
            },
            "fontSize": {
                    "body-md": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
                    "headline-sm": ["18px", {"lineHeight": "1.4", "fontWeight": "600"}],
                    "code-sm": ["13px", {"lineHeight": "1.5", "fontWeight": "400"}],
                    "display-lg": ["48px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "headline-md": ["24px", {"lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "label-md": ["12px", {"lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "600"}],
                    "body-lg": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}]
            }
          },
        },
      }
    </script>
<style>
        body {
            background-color: #f6f6f8;
            margin: 0;
            padding: 0;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
</head>
<body class="font-body-md text-on-background">
<!-- TopAppBar -->
<header class="fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200 shadow-sm font-inter antialiased">
<div class="flex items-center gap-4">
<span class="text-xl font-black tracking-tight text-slate-900">QuizMaster</span>
<nav class="hidden md:flex gap-6 ml-8">
<a class="text-slate-600 hover:bg-slate-50 transition-colors px-3 py-1 rounded-lg text-sm font-medium" href="#">Dashboard</a>
<a class="text-blue-600 font-semibold px-3 py-1 rounded-lg text-sm" href="#">My Quizzes</a>
<a class="text-slate-600 hover:bg-slate-50 transition-colors px-3 py-1 rounded-lg text-sm font-medium" href="#">Templates</a>
<a class="text-slate-600 hover:bg-slate-50 transition-colors px-3 py-1 rounded-lg text-sm font-medium" href="#">Analytics</a>
</nav>
</div>
<div class="flex items-center gap-4">
<button class="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary rounded-xl font-semibold active:scale-95 transition-transform">
<span>Save</span>
</button>
<div class="flex items-center gap-2 border-l pl-4 border-slate-200">
<button class="p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors active:scale-95 transition-transform" title="Sync Status">
<span class="material-symbols-outlined" data-icon="cloud_done">cloud_done</span>
</button>
<button class="p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors active:scale-95 transition-transform" title="Profile">
<span class="material-symbols-outlined" data-icon="account_circle">account_circle</span>
</button>
</div>
</div>
</header>
<!-- SideNavBar (Editor Workspace) -->
<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col p-4 bg-slate-50 border-r border-slate-200 font-inter text-sm font-medium">
<div class="mb-8 px-4">
<h2 class="text-slate-900 font-bold text-lg">QuizMaster Pro</h2>
<p class="text-slate-500 text-xs">Editor Workspace</p>
</div>
<nav class="flex-1 flex flex-col gap-1">
<a class="flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span>Dashboard</span>
</a>
<a class="flex items-center gap-3 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="description">description</span>
<span>My Quizzes</span>
</a>
<a class="flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="layers">layers</span>
<span>Templates</span>
</a>
<a class="flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="analytics">analytics</span>
<span>Analytics</span>
</a>
</nav>
<button class="mb-6 mx-4 py-3 bg-primary-container text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
<span class="material-symbols-outlined" data-icon="add">add</span>
            New Quiz
        </button>
<div class="mt-auto border-t border-slate-200 pt-4 flex flex-col gap-1">
<a class="flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span>Settings</span>
</a>
<a class="flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="help_outline">help_outline</span>
<span>Help</span>
</a>
</div>
</aside>
<!-- Main Workspace Canvas -->
<main class="ml-64 mt-16 min-h-[calc(100vh-64px)] flex items-center justify-center p-lg overflow-hidden">
<!-- Empty State Container -->
<div class="max-w-xl w-full flex flex-col items-center text-center animate-fade-in">
<!-- Illustration / Icon Background Decoration -->
<div class="relative mb-8 w-48 h-48 flex items-center justify-center">
<div class="absolute inset-0 bg-blue-100/50 rounded-full scale-150 blur-3xl"></div>
<div class="relative z-10 w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
<span class="material-symbols-outlined text-primary-container text-5xl" data-icon="quiz" style="font-variation-settings: 'FILL' 1;">quiz</span>
</div>
<div class="absolute -top-4 -right-4 w-12 h-12 bg-tertiary-container rounded-full shadow-lg flex items-center justify-center text-on-tertiary-container border-2 border-white">
<span class="material-symbols-outlined text-2xl" data-icon="auto_awesome">auto_awesome</span>
</div>
</div>
<!-- Empty State Typography -->
<div class="space-y-4 mb-10">
<h1 class="font-headline-md text-on-background text-3xl tracking-tight">Your Quiz Canvas is Empty</h1>
<p class="font-body-lg text-on-surface-variant max-w-sm mx-auto">
                    Start building your exam by adding your first question. Choose from multiple choice, true/false, or essay formats.
                </p>
</div>
<!-- Primary Action -->
<button class="group relative flex flex-col items-center gap-4 active:scale-95 transition-all duration-200">
<div class="flex items-center justify-center w-20 h-20 bg-primary-container text-on-primary rounded-full shadow-[0_8px_30px_rgb(36,99,235,0.4)] group-hover:shadow-[0_12px_40px_rgb(36,99,235,0.6)] group-hover:-translate-y-1 transition-all duration-300">
<span class="material-symbols-outlined text-4xl" data-icon="add">add</span>
</div>
<span class="font-headline-sm text-primary-container tracking-wide uppercase text-xs">Add Question</span>
</button>
<!-- Secondary Guidance / Hints -->
<div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4">
<div class="p-4 bg-white/50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
<span class="material-symbols-outlined text-slate-400 mb-2" data-icon="import_contacts">import_contacts</span>
<span class="font-label-md text-slate-500">Import from CSV</span>
</div>
<div class="p-4 bg-white/50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
<span class="material-symbols-outlined text-slate-400 mb-2" data-icon="smart_toy">smart_toy</span>
<span class="font-label-md text-slate-500">Generate with AI</span>
</div>
<div class="p-4 bg-white/50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
<span class="material-symbols-outlined text-slate-400 mb-2" data-icon="library_add">library_add</span>
<span class="font-label-md text-slate-500">From Bank</span>
</div>
</div>
</div>
<!-- Decorative Elements for "Corporate/Modern" feel -->
<div class="fixed bottom-12 right-12 opacity-5 pointer-events-none">
<span class="material-symbols-outlined text-[300px]" data-icon="edit_note">edit_note</span>
</div>
</main>
<!-- Footer Meta (Optional for Editor) -->
<footer class="fixed bottom-0 left-64 right-0 h-12 bg-white/80 backdrop-blur-sm border-t border-slate-200 flex items-center justify-between px-8 text-[11px] font-medium text-slate-400 uppercase tracking-widest z-40">
<div class="flex gap-6">
<span>Last saved: 2 minutes ago</span>
<span>Unpublished Changes</span>
</div>
<div class="flex gap-6">
<span>QuizMaster Engine v2.4.0</span>
<a class="hover:text-blue-600 transition-colors" href="#">Privacy Policy</a>
</div>
</footer>
</body></html>