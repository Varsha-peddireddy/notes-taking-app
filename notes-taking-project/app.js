class Note {
  constructor(id, title, content, color = '#ffffff', pinned = false, tags = []) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.color = color;
    this.pinned = pinned;
    this.tags = tags;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}

class SuperNotesApp {
  constructor() {
    // Basic app elements
    this.noteList = document.getElementById('note-list');
    this.emptyState = document.getElementById('empty-state');
    this.noteCount = document.getElementById('note-count');
    this.noteTitle = document.getElementById('note-title');
    this.noteContent = document.getElementById('note-content');
    this.addNoteBtn = document.getElementById('add-note-btn');
    this.clearFormBtn = document.getElementById('clear-form-btn');
    this.deleteAllBtn = document.getElementById('delete-all-btn');
    this.searchInput = document.getElementById('search-notes');
    this.searchBtn = document.getElementById('search-btn');
    this.confirmModal = document.getElementById('confirm-modal');
    this.cancelDeleteBtn = document.getElementById('cancel-delete');
    this.confirmDeleteBtn = document.getElementById('confirm-delete');
    
    // Enhanced feature elements
    this.themeBtn = document.getElementById('theme-btn');
    this.noteTagsInput = document.getElementById('note-tags');
    this.filterBy = document.getElementById('filter-by');
    this.sortBy = document.getElementById('sort-by');
    
    this.noteId = 1;
    this.notes = [];
    this.currentTags = [];
    
    this.init();
  }
  
  init() {
    this.loadNotes();
    this.setupEventListeners();
    this.updateEmptyState();
    this.updateCharacterCounters();
    
    // Initialize dark mode if previously set
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
      const icon = this.themeBtn.querySelector('i');
      icon.classList.replace('fa-moon', 'fa-sun');
    }
    
    // Initialize code highlighting
    if (typeof hljs !== 'undefined') {
      hljs.highlightAll();
    }
  }
  
  setupEventListeners() {
    // Basic functionality
    this.addNoteBtn.addEventListener('click', () => this.addNote());
    this.clearFormBtn.addEventListener('click', () => this.clearForm());
    this.deleteAllBtn.addEventListener('click', () => this.showDeleteConfirmation());
    this.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteConfirmation());
    this.confirmDeleteBtn.addEventListener('click', () => {
      this.deleteAllNotes();
      this.hideDeleteConfirmation();
    });
    this.searchInput.addEventListener('input', () => this.searchNotes());
    this.searchBtn.addEventListener('click', () => this.searchNotes());
    this.noteTitle.addEventListener('input', () => this.updateCharacterCounters());
    this.noteContent.addEventListener('input', () => this.updateCharacterCounters());
    this.noteContent.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.addNote();
      }
    });
    
    // Enhanced features
    if (this.themeBtn) {
      this.themeBtn.addEventListener('click', () => this.toggleDarkMode());
    }
    
    if (this.noteTagsInput) {
      this.noteTagsInput.addEventListener('keydown', (e) => this.handleTagInput(e));
    }
    
    if (this.filterBy) {
      this.filterBy.addEventListener('change', () => this.displayNotes());
    }
    
    if (this.sortBy) {
      this.sortBy.addEventListener('change', () => this.displayNotes());
    }
    
    // Formatting toolbar
    document.querySelectorAll('.formatting-toolbar button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const format = e.currentTarget.dataset.format;
        this.applyFormatting(format);
      });
    });
    
    // Export buttons
    if (document.getElementById('export-json')) {
      document.getElementById('export-json').addEventListener('click', () => this.exportNotes('json'));
    }
    if (document.getElementById('export-md')) {
      document.getElementById('export-md').addEventListener('click', () => this.exportNotes('md'));
    }
    if (document.getElementById('export-pdf')) {
      document.getElementById('export-pdf').addEventListener('click', () => this.exportNotes('pdf'));
    }
  }
  
  // ===== CORE FUNCTIONALITY =====
  loadNotes() {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      this.notes = JSON.parse(savedNotes);
      if (this.notes.length > 0) {
        this.noteId = this.notes[this.notes.length - 1].id + 1;
      }
      this.displayNotes();
    }
  }
  
  saveNotes() {
    localStorage.setItem('notes', JSON.stringify(this.notes));
    this.updateNoteCount();
    this.updateEmptyState();
  }
  
  addNote() {
    const title = this.noteTitle.value.trim();
    const content = this.noteContent.value.trim();
    const color = document.getElementById('note-color') ? document.getElementById('note-color').value : '#ffffff';
    
    if (this.validateInput(title, content)) {
      const newNote = new Note(
        this.noteId++, 
        title, 
        content, 
        color,
        false,
        this.currentTags || []
      );
      
      this.notes.push(newNote);
      this.saveNotes();
      this.createNoteElement(newNote);
      this.clearForm();
      this.currentTags = []; // Reset tags after adding note
    }
  }
  
  validateInput(title, content) {
    let isValid = true;
    
    // Reset warnings
    this.noteTitle.classList.remove('warning');
    this.noteContent.classList.remove('warning');
    
    if (!title) {
      this.noteTitle.classList.add('warning');
      isValid = false;
    }
    
    if (!content) {
      this.noteContent.classList.add('warning');
      isValid = false;
    }
    
    if (!isValid) {
      // Shake animation for visual feedback
      const noteForm = document.querySelector('.note-form');
      noteForm.classList.add('shake');
      setTimeout(() => {
        noteForm.classList.remove('shake');
      }, 500);
    }
    
    return isValid;
  }
  
  clearForm() {
    this.noteTitle.value = '';
    this.noteContent.value = '';
    this.updateCharacterCounters();
    this.noteTitle.focus();
    
    // Clear color picker if exists
    if (document.getElementById('note-color')) {
      document.getElementById('note-color').value = '#ffffff';
    }
    
    // Clear tags
    this.currentTags = [];
    const tagsContainer = document.querySelector('.note-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = '';
    }
  }
  
  createNoteElement(note) {
    const noteEl = document.createElement('div');
    noteEl.className = 'note-item';
    noteEl.dataset.id = note.id;
    noteEl.style.backgroundColor = note.color;
    
    const formattedDate = new Date(note.createdAt).toLocaleString();
    const tagsHTML = note.tags && note.tags.length > 0 
      ? `<div class="note-tags">${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
      : '';
    
    noteEl.innerHTML = `
      <div class="note-header">
        <h3>${note.title}</h3>
        <button class="btn btn-icon btn-pin">
          <i class="fas fa-thumbtack ${note.pinned ? 'active' : ''}"></i>
        </button>
      </div>
      ${tagsHTML}
      <div class="note-content">${this.formatNoteContent(note.content)}</div>
      <div class="note-date">Created: ${formattedDate}</div>
      <div class="note-actions">
        <button class="btn btn-secondary btn-edit">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-danger btn-delete">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    
    // Add event listeners
    noteEl.querySelector('.btn-delete').addEventListener('click', () => this.deleteNote(note.id));
    noteEl.querySelector('.btn-edit').addEventListener('click', () => this.editNote(note.id));
    noteEl.querySelector('.btn-pin').addEventListener('click', () => this.togglePin(note.id));
    
    // Add to the DOM with animation
    this.noteList.prepend(noteEl);
  }
  
  formatNoteContent(content) {
    // Simple markdown formatting
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\_(.*?)\_/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/\!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
    
    // Preserve line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }
  
  displayNotes(notesToDisplay = null) {
    this.noteList.innerHTML = '';
    
    let notes = notesToDisplay || this.notes;
    
    // Filtering
    if (this.filterBy) {
      const filterBy = this.filterBy.value;
      if (filterBy === 'pinned') {
        notes = notes.filter(note => note.pinned);
      } else if (filterBy === 'tag' && this.currentTags?.length) {
        notes = notes.filter(note => 
          note.tags?.some(tag => this.currentTags.includes(tag))
        );
      }
    }
    
    // Sorting
    if (this.sortBy) {
      const sortBy = this.sortBy.value;
      notes.sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
    }
    
    if (notes.length === 0) {
      this.updateEmptyState();
      return;
    }
    
    // Separate pinned and unpinned notes
    const pinnedNotes = notes.filter(note => note.pinned);
    const unpinnedNotes = notes.filter(note => !note.pinned);
    
    // Display pinned notes first
    pinnedNotes.forEach(note => this.createNoteElement(note));
    unpinnedNotes.forEach(note => this.createNoteElement(note));
    
    this.updateEmptyState();
    
    // Re-highlight code blocks if hljs is available
    if (typeof hljs !== 'undefined') {
      setTimeout(() => {
        document.querySelectorAll('pre code').forEach(block => {
          hljs.highlightElement(block);
        });
      }, 0);
    }
  }
  
  deleteNote(id) {
    this.notes = this.notes.filter(note => note.id !== id);
    this.saveNotes();
    this.displayNotes();
  }
  
  editNote(id) {
    const note = this.notes.find(note => note.id === id);
    if (!note) return;
    
    this.noteTitle.value = note.title;
    this.noteContent.value = note.content;
    
    // Set color if color picker exists
    if (document.getElementById('note-color')) {
      document.getElementById('note-color').value = note.color;
    }
    
    // Set tags
    this.currentTags = [...note.tags];
    this.renderTags();
    
    // Remove the note being edited
    this.notes = this.notes.filter(n => n.id !== id);
    this.saveNotes();
    
    // Focus on title field
    this.noteTitle.focus();
  }
  
  togglePin(id) {
    const note = this.notes.find(note => note.id === id);
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = new Date().toISOString();
      this.saveNotes();
      this.displayNotes();
    }
  }
  
  deleteAllNotes() {
    this.notes = [];
    this.noteId = 1;
    this.saveNotes();
    this.displayNotes();
  }
  
  searchNotes() {
    const searchTerm = this.searchInput.value.toLowerCase();
    
    if (!searchTerm) {
      this.displayNotes();
      return;
    }
    
    const filteredNotes = this.notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) || 
      note.content.toLowerCase().includes(searchTerm)
    );
    
    this.displayNotes(filteredNotes);
  }
  
  showDeleteConfirmation() {
    if (this.notes.length === 0) return;
    this.confirmModal.classList.add('active');
  }
  
  hideDeleteConfirmation() {
    this.confirmModal.classList.remove('active');
  }
  
  updateEmptyState() {
    if (this.notes.length === 0) {
      this.emptyState.style.display = 'block';
      this.noteList.style.display = 'none';
    } else {
      this.emptyState.style.display = 'none';
      this.noteList.style.display = 'grid';
    }
  }
  
  updateNoteCount() {
    const count = this.notes.length;
    this.noteCount.textContent = `${count} ${count === 1 ? 'note' : 'notes'}`;
  }
  
  updateCharacterCounters() {
    const titleCount = document.getElementById('title-count');
    const contentCount = document.getElementById('content-count');
    
    if (titleCount && contentCount) {
      const titleLength = this.noteTitle.value.length;
      const contentLength = this.noteContent.value.length;
      
      titleCount.textContent = titleLength;
      contentCount.textContent = contentLength;
      
      // Add warning class if approaching limit
      titleCount.classList.toggle('warning', titleLength > 40);
      contentCount.classList.toggle('warning', contentLength > 450);
    }
  }
  
  // ===== ENHANCED FEATURES =====
  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const icon = this.themeBtn.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  }
  
  applyFormatting(format) {
    const textarea = this.noteContent;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = '';
    let cursorOffset = 0;

    switch(format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'code':
        if (selectedText.includes('\n')) {
          formattedText = "```\n" + selectedText + "\n```";
          cursorOffset = selectedText ? 0 : 4;
        } else {
          formattedText = `\`${selectedText}\``;
          cursorOffset = selectedText ? 0 : 1;
        }
        break;
      case 'link':
        formattedText = `[${selectedText || 'text'}](url)`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'image':
        formattedText = `![${selectedText || 'alt text'}](image-url)`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      default:
        formattedText = selectedText;
    }

    textarea.value = textarea.value.substring(0, start) + formattedText + 
                     textarea.value.substring(end);
    
    // Set cursor position
    if (selectedText) {
      textarea.setSelectionRange(start, start + formattedText.length);
    } else {
      const newCursorPos = start + formattedText.length - cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }
    
    textarea.focus();
  }
  
  handleTagInput(e) {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const tagInput = e.target;
      const tags = tagInput.value.split(',').map(t => t.trim()).filter(t => t);
      if (tags.length) {
        this.currentTags = [...new Set([...(this.currentTags || []), ...tags])];
        tagInput.value = '';
        this.renderTags();
      }
    }
  }
  
  renderTags() {
    const tagsContainer = document.querySelector('.note-tags') || 
                         document.createElement('div');
    tagsContainer.className = 'note-tags';
    tagsContainer.innerHTML = this.currentTags.map(tag => 
      `<span class="tag">${tag} <i class="fas fa-times remove-tag" data-tag="${tag}"></i></span>`
    ).join('');
    
    // Add click handler for remove tag buttons
    tagsContainer.querySelectorAll('.remove-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tagToRemove = btn.dataset.tag;
        this.currentTags = this.currentTags.filter(t => t !== tagToRemove);
        this.renderTags();
      });
    });
    
    if (!document.querySelector('.note-tags')) {
      const noteForm = document.querySelector('.note-form');
      if (noteForm) {
        noteForm.appendChild(tagsContainer);
      }
    }
  }
  
  exportNotes(format) {
    let content, mimeType, filename;
    
    switch(format) {
      case 'json':
        content = JSON.stringify(this.notes, null, 2);
        mimeType = 'application/json';
        filename = 'notes-export.json';
        break;
      case 'md':
        content = this.notes.map(note => {
          let mdContent = `# ${note.title}\n\n`;
          if (note.tags && note.tags.length > 0) {
            mdContent += `Tags: ${note.tags.join(', ')}\n\n`;
          }
          mdContent += `${note.content}\n\n---\n`;
          return mdContent;
        }).join('\n');
        mimeType = 'text/markdown';
        filename = 'notes-export.md';
        break;
      case 'pdf':
        this.generatePDF();
        return;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  generatePDF() {
    if (typeof jsPDF === 'undefined') {
      alert('PDF generation requires jsPDF library. Please make sure it is loaded.');
      return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('My Notes Export', 105, 15, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Exported on: ${new Date().toLocaleString()}`, 105, 25, { align: 'center' });
    
    let yPosition = 40;
    
    this.notes.forEach((note, index) => {
      if (index > 0) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Note title
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text(note.title, 15, yPosition);
      yPosition += 10;
      
      // Note metadata
      doc.setFontSize(10);
      doc.setTextColor(100);
      const createdAt = new Date(note.createdAt).toLocaleString();
      let metaText = `Created: ${createdAt}`;
      if (note.tags && note.tags.length > 0) {
        metaText += ` | Tags: ${note.tags.join(', ')}`;
      }
      doc.text(metaText, 15, yPosition);
      yPosition += 8;
      
      // Note content
      doc.setFontSize(12);
      doc.setTextColor(20);
      const splitText = doc.splitTextToSize(note.content, 180);
      doc.text(splitText, 15, yPosition + 5);
      
      // Add horizontal line
      doc.setDrawColor(200);
      doc.line(15, doc.internal.pageSize.height - 15, 195, doc.internal.pageSize.height - 15);
    });
    
    doc.save('notes-export.pdf');
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SuperNotesApp();
});