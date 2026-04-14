import { detect } from './detect';
import {
  generate,
  type ProjectConfig,
  type OutputFormat,
  FORMAT_LABELS,
  FORMAT_FILENAMES,
} from './templates';
import './styles.css';

// --- State ---

const state: ProjectConfig = {
  name: '',
  description: '',
  language: '',
  framework: '',
  testing: '',
  buildTool: '',
  linting: '',
  packageManager: '',
  codeStyle: 'functional',
  indentation: '2 spaces',
  commitConvention: 'conventional',
  testConvention: 'colocated',
  namingConvention: 'camelCase',
  errorHandling: 'exceptions',
  customRules: '',
};

let currentStep = 1;
let selectedFormats: OutputFormat[] = ['claude'];
let activeTab: OutputFormat = 'claude';

// --- DOM helpers ---

function $(selector: string): HTMLElement {
  return document.querySelector(selector)!;
}

function $input(id: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return document.getElementById(id) as HTMLInputElement;
}

// --- Step navigation ---

function showStep(step: number) {
  currentStep = step;
  document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.steps .step').forEach(el => el.classList.remove('active'));

  $(`#step-${step}`).classList.add('active');
  document.querySelector(`.steps .step[data-step="${step}"]`)!.classList.add('active');

  // Mark completed steps
  document.querySelectorAll('.steps .step').forEach(el => {
    const s = Number((el as HTMLElement).dataset.step);
    el.classList.toggle('completed', s < step);
  });

  if (step === 3) {
    renderOutput();
  }
}

function readFormState() {
  state.name = $input('project-name').value;
  state.description = $input('project-desc').value;
  state.language = $input('language').value;
  state.framework = $input('framework').value;
  state.testing = $input('testing').value;
  state.buildTool = $input('build-tool').value;
  state.linting = $input('linting').value;
  state.packageManager = $input('package-manager').value;
  state.codeStyle = $input('code-style').value;
  state.indentation = $input('indentation').value;
  state.commitConvention = $input('commit-convention').value;
  state.testConvention = $input('test-convention').value;
  state.namingConvention = $input('naming-convention').value;
  state.errorHandling = $input('error-handling').value;
  state.customRules = $input('custom-rules').value;
}

function writeFormState() {
  ($input('project-name') as HTMLInputElement).value = state.name;
  ($input('project-desc') as HTMLInputElement).value = state.description;
  ($input('language') as HTMLSelectElement).value = state.language;
  ($input('framework') as HTMLSelectElement).value = state.framework;
  ($input('testing') as HTMLSelectElement).value = state.testing;
  ($input('build-tool') as HTMLSelectElement).value = state.buildTool;
  ($input('linting') as HTMLSelectElement).value = state.linting;
  ($input('package-manager') as HTMLSelectElement).value = state.packageManager;
}

// --- Detection ---

function handleDetect() {
  const raw = $input('config-paste').value.trim();
  if (!raw) return;

  const result = detect(raw);
  if (!result) {
    showToast('Could not parse the input. Check that it is valid JSON or TOML.');
    return;
  }

  state.name = result.name || state.name;
  state.description = result.description || state.description;
  state.language = result.language;
  state.framework = result.framework;
  state.testing = result.testing;
  state.buildTool = result.buildTool;
  state.linting = result.linting;
  state.packageManager = result.packageManager;

  writeFormState();
  showToast('Stack detected! Review the fields below.');
}

// --- Output rendering ---

function getSelectedFormats(): OutputFormat[] {
  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    '.checkbox-group input[type="checkbox"]'
  );
  return Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value as OutputFormat);
}

function renderOutput() {
  readFormState();
  selectedFormats = getSelectedFormats();

  if (selectedFormats.length === 0) {
    selectedFormats = ['claude'];
  }
  if (!selectedFormats.includes(activeTab)) {
    activeTab = selectedFormats[0];
  }

  // Render tabs
  const tabsContainer = $('#output-tabs');
  tabsContainer.innerHTML = selectedFormats
    .map(
      fmt =>
        `<button class="output-tab${fmt === activeTab ? ' active' : ''}" data-format="${fmt}">${FORMAT_LABELS[fmt]}</button>`
    )
    .join('');

  // Render preview
  const preview = $('#output-preview');
  const content = generate(activeTab, state);
  preview.textContent = content;

  // Attach tab click handlers
  tabsContainer.querySelectorAll<HTMLButtonElement>('.output-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.format as OutputFormat;
      renderOutput();
    });
  });
}

// --- Copy / Download ---

async function handleCopy() {
  readFormState();
  const content = generate(activeTab, state);
  try {
    await navigator.clipboard.writeText(content);
    showToast('Copied to clipboard!');
  } catch {
    showToast('Failed to copy. Try downloading instead.');
  }
}

function handleDownload() {
  readFormState();
  const content = generate(activeTab, state);
  const filename = FORMAT_FILENAMES[activeTab];
  downloadFile(filename, content);
}

function handleDownloadAll() {
  readFormState();
  const formats = getSelectedFormats();
  formats.forEach(fmt => {
    const content = generate(fmt, state);
    const filename = FORMAT_FILENAMES[fmt];
    downloadFile(filename, content);
  });
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Toast ---

function showToast(message: string) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast!.classList.remove('show'), 2500);
}

// --- Init ---

function init() {
  // Step navigation buttons
  $('#next-1').addEventListener('click', () => {
    readFormState();
    showStep(2);
  });
  $('#back-2').addEventListener('click', () => showStep(1));
  $('#next-2').addEventListener('click', () => {
    readFormState();
    showStep(3);
  });
  $('#back-3').addEventListener('click', () => showStep(2));

  // Step indicator clicks
  document.querySelectorAll<HTMLButtonElement>('.steps .step').forEach(btn => {
    btn.addEventListener('click', () => {
      readFormState();
      showStep(Number(btn.dataset.step));
    });
  });

  // Detect button
  $('#detect-btn').addEventListener('click', handleDetect);

  // Checkbox change triggers re-render when on step 3
  document.querySelectorAll<HTMLInputElement>('.checkbox-group input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (currentStep === 3) renderOutput();
    });
  });

  // Copy / Download
  $('#copy-btn').addEventListener('click', handleCopy);
  $('#download-btn').addEventListener('click', handleDownload);
  $('#download-all-btn').addEventListener('click', handleDownloadAll);
}

document.addEventListener('DOMContentLoaded', init);
