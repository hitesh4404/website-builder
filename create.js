// Hit-X Coding Website Builder - Core JavaScript

class WebsiteBuilder {
    constructor() {
        this.currentPage = 'home';
        this.pages = {
            home: { elements: [], styles: {} }
        };
        this.selectedElement = null;
        this.draggedElement = null;
        this.elementCounter = 0;

        // Layer Management System
        this.layerManager = new LayerManager(this);

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupSidebarToggles();
        this.setupFAB();
        this.setupModals();
        this.setupFloatingToolbar();
        this.setupGlobalControls();
        this.setupMovableElements();

        // Initialize layer manager
        this.layerManager = new LayerManager(this);

        // Load saved project from localStorage
        this.loadFromLocalStorage();

        // Update page selector and load current page content
        this.updatePageSelector();
        this.loadPageContent(this.currentPage);
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProject());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadProject());
        document.getElementById('exportBtn').addEventListener('click', () => this.showExportModal());

        // Page management
        document.getElementById('addPageBtn').addEventListener('click', () => this.showAddPageModal());
        document.getElementById('pageSelector').addEventListener('change', (e) => this.switchPage(e.target.value));

        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.closest('.view-btn').dataset.view));
        });

        // Canvas events
        const canvas = document.getElementById('canvasInner');
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        canvas.addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Auto-save
        setInterval(() => this.autoSave(), 30000); // Auto-save every 30 seconds
    }

    setupDragAndDrop() {
        const elements = document.querySelectorAll('.element-item');
        const canvas = document.getElementById('canvasInner');

        elements.forEach(element => {
            element.addEventListener('dragstart', (e) => this.handleDragStart(e));
            element.addEventListener('dragend', (e) => this.handleDragEnd(e));
        });

        canvas.addEventListener('dragover', (e) => this.handleDragOver(e));
        canvas.addEventListener('drop', (e) => this.handleDrop(e));
    }

    handleDragStart(e) {
        this.draggedElement = e.target.dataset.element;
        e.dataTransfer.effectAllowed = 'copy';
        e.target.style.opacity = '0.5';
    }

    handleDragEnd(e) {
        e.target.style.opacity = '1';
        this.draggedElement = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(e) {
        e.preventDefault();
        if (!this.draggedElement) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.addElement(this.draggedElement, x, y);
        this.removePlaceholder();
    }

    addElement(type, x, y) {
        const element = this.createElement(type);
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        const canvas = document.getElementById('canvasInner');
        canvas.appendChild(element);

        // Add to page data
        const elementData = {
            id: element.id,
            type: type,
            x: x,
            y: y,
            content: element.innerHTML,
            styles: this.getElementStyles(element)
        };

        // Add form-specific data if it's a form
        if (type === 'form') {
            const form = element.querySelector('form');
            if (form) {
                elementData.formEmail = form.dataset.formEmail || '';
            }
        }

        this.pages[this.currentPage].elements.push(elementData);

        // Create layer for the new element
        if (this.layerManager) {
            this.layerManager.createLayer(element, elementData);
        }

        this.selectElement(element);

        // Auto-save after adding element
        this.saveToLocalStorage();
    }

    createElement(type) {
        this.elementCounter++;
        const element = document.createElement('div');
        element.id = `element-${this.elementCounter}`;
        element.className = 'canvas-element';
        element.dataset.elementType = type;

        switch (type) {
            case 'heading':
                element.innerHTML = '<h2 style="color: #333333; outline: none; border: 1px solid transparent; padding: 5px; cursor: text;">New Heading</h2>';
                const heading = element.querySelector('h2');
                heading.contentEditable = 'true';

                // Add click-to-edit functionality
                heading.addEventListener('click', (e) => {
                    e.stopPropagation();
                    heading.focus();
                    this.selectElement(element);
                });

                heading.addEventListener('focus', () => {
                    heading.style.border = '1px solid var(--primary-red)';
                    heading.style.backgroundColor = 'rgba(255,255,255,0.9)';
                    heading.style.color = '#333';
                });

                heading.addEventListener('blur', () => {
                    heading.style.border = '1px solid transparent';
                    heading.style.backgroundColor = 'transparent';
                    heading.style.color = '#333333';
                });

                // Prevent element controls from interfering with heading editing
                heading.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });

                // Prevent backspace from removing elements when editing text
                heading.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.stopPropagation();
                    }
                });
                break;
            case 'text':
                element.innerHTML = '<p style="color: #333333; outline: none; border: 1px solid transparent; padding: 5px; cursor: text;">Add your text here. Click to edit.</p>';
                const textElement = element.querySelector('p');
                textElement.contentEditable = 'true';

                // Add click-to-edit functionality
                textElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    textElement.focus();
                    this.selectElement(element);
                });

                textElement.addEventListener('focus', () => {
                    textElement.style.border = '1px solid var(--primary-red)';
                    textElement.style.backgroundColor = 'rgba(255,255,255,0.9)';
                    textElement.style.color = '#333';
                });

                textElement.addEventListener('blur', () => {
                    textElement.style.border = '1px solid transparent';
                    textElement.style.backgroundColor = 'transparent';
                    textElement.style.color = '#333333';
                });

                // Prevent element controls from interfering with text editing
                textElement.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });

                // Prevent backspace from removing elements when editing text
                textElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.stopPropagation();
                    }
                });
                break;
            case 'button':
                element.innerHTML = '<button style="padding: 10px 20px; background: var(--primary-red); color: white; border: none; border-radius: 8px; cursor: pointer;">Click Me</button>';
                // Add interactive drag handle for buttons
                this.addInteractiveDragHandle(element, 'button');
                break;
            case 'image':
                element.innerHTML = '<div style="width: 200px; height: 150px; background: #f0f0f0; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #666;">🖼️ Click to upload image</div>';
                element.addEventListener('click', () => this.uploadImage(element));
                break;
            case 'video':
                element.innerHTML = '<div style="width: 400px; height: 300px; background: #f0f0f0; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #666; flex-direction: column; gap: 10px;"><div style="font-size: 2rem;">🎥</div><div>Click to upload video</div></div>';
                element.addEventListener('click', () => this.uploadVideo(element));
                break;
            case 'container':
                element.innerHTML = '<div style="min-height: 100px; padding: 20px; border: 2px dashed #ccc; background: rgba(255,255,255,0.1);">Container - Add elements here</div>';
                break;
            case 'section':
                element.innerHTML = '<section style="min-height: 200px; padding: 40px; background: #f8f9fa;">New Section</section>';
                break;
            case 'divider':
                element.innerHTML = '<hr style="border: none; height: 2px; background: linear-gradient(90deg, var(--primary-red), var(--primary-blue)); margin: 20px 0;">';
                break;
            case 'spacer':
                element.innerHTML = '<div style="height: 50px;"></div>';
                break;
            case 'link':
                element.innerHTML = '<a href="#" style="color: var(--primary-red); text-decoration: none; padding: 10px 20px; border: 2px solid var(--primary-red); border-radius: 8px; display: inline-block;">Click Here</a>';
                break;
            case 'form':
                element.innerHTML = `
                    <div class="contact-form-container" style="
                        background: #ffffff;
                        padding: 40px;
                        border-radius: 12px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        max-width: 500px;
                        margin: 0 auto;
                        font-family: 'Inter', sans-serif;
                    ">
                        <div class="form-header" style="text-align: center; margin-bottom: 30px;">
                            <h2 class="form-title" contenteditable="true" style="
                                color: #1a1a1a;
                                font-size: 28px;
                                font-weight: 600;
                                margin: 0 0 10px 0;
                                outline: none;
                                border: 1px solid transparent;
                                padding: 5px;
                                border-radius: 4px;
                            ">Get In Touch</h2>
                        </div>
                        
                        <form class="contact-form" style="
                            display: flex;
                            flex-direction: column;
                            gap: 20px;
                        ">
                            <div class="form-group">
                                <input type="text" name="fullName" placeholder="Full Name" required style="
                                    width: 100%;
                                    padding: 15px;
                                    border: 2px solid #e1e5e9;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    font-family: inherit;
                                    transition: border-color 0.3s ease;
                                    box-sizing: border-box;
                                ">
                            </div>
                            
                            <div class="form-group">
                                <input type="email" name="email" placeholder="Email Address" required style="
                                    width: 100%;
                                    padding: 15px;
                                    border: 2px solid #e1e5e9;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    font-family: inherit;
                                    transition: border-color 0.3s ease;
                                    box-sizing: border-box;
                                ">
                            </div>
                            
                            <div class="form-group">
                                <textarea name="message" placeholder="Your Message" required rows="5" style="
                                    width: 100%;
                                    padding: 15px;
                                    border: 2px solid #e1e5e9;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    font-family: inherit;
                                    transition: border-color 0.3s ease;
                                    box-sizing: border-box;
                                    resize: vertical;
                                    min-height: 120px;
                                "></textarea>
                            </div>
                            
                            <button type="submit" class="submit-btn" contenteditable="true" style="
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                padding: 15px 30px;
                                border: none;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                font-family: inherit;
                                outline: none;
                                border: 1px solid transparent;
                            ">Send Message</button>
                        </form>
                        
                        <div class="email-warning" style="
                            display: none;
                            background: #fff3cd;
                            border: 1px solid #ffeaa7;
                            color: #856404;
                            padding: 15px;
                            border-radius: 8px;
                            margin-top: 20px;
                            text-align: center;
                            font-size: 14px;
                        ">
                            ⚠️ Please attach your admin email to this contact form using the Edit Panel.
                        </div>
                    </div>
                `;

                // Add form submission handler
                const form = element.querySelector('.contact-form');
                form.addEventListener('submit', (e) => this.handleContactFormSubmit(e, element));

                // Make form title editable
                const formTitle = element.querySelector('.form-title');
                formTitle.addEventListener('focus', () => {
                    formTitle.style.border = '1px solid #667eea';
                    formTitle.style.backgroundColor = 'rgba(255,255,255,0.9)';
                });
                formTitle.addEventListener('blur', () => {
                    formTitle.style.border = '1px solid transparent';
                    formTitle.style.backgroundColor = 'transparent';
                });

                // Make submit button text editable
                const submitBtnEditable = element.querySelector('.submit-btn');
                submitBtnEditable.addEventListener('focus', () => {
                    submitBtnEditable.style.border = '1px solid #667eea';
                    submitBtnEditable.style.backgroundColor = 'rgba(255,255,255,0.9)';
                });
                submitBtnEditable.addEventListener('blur', () => {
                    submitBtnEditable.style.border = '1px solid transparent';
                    submitBtnEditable.style.backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                });

                // Add hover effects for form inputs
                const inputs = element.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    input.addEventListener('focus', () => {
                        input.style.borderColor = '#667eea';
                        input.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    });
                    input.addEventListener('blur', () => {
                        input.style.borderColor = '#e1e5e9';
                        input.style.boxShadow = 'none';
                    });
                });

                // Add hover effect for submit button
                const submitBtnHover = element.querySelector('.submit-btn');
                submitBtnHover.addEventListener('mouseenter', () => {
                    submitBtnHover.style.transform = 'translateY(-2px)';
                    submitBtnHover.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
                });
                submitBtnHover.addEventListener('mouseleave', () => {
                    submitBtnHover.style.transform = 'translateY(0)';
                    submitBtnHover.style.boxShadow = 'none';
                });

                break;
            default:
                element.innerHTML = '<div>New Element</div>';
        }

        this.addElementControls(element);
        return element;
    }

    addInteractiveDragHandle(element, type) {
        // Create a drag handle specifically for interactive elements
        const dragHandle = document.createElement('div');
        dragHandle.className = 'interactive-drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.title = 'Move element';

        // Style the drag handle
        dragHandle.style.cssText = `
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-red);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: grab;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 1000;
            user-select: none;
            pointer-events: auto;
        `;

        // Show drag handle on hover
        element.addEventListener('mouseenter', () => {
            dragHandle.style.opacity = '1';
        });

        element.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
                dragHandle.style.opacity = '0';
            }
        });

        // Prevent default drag behavior on interactive elements
        const interactiveElements = element.querySelectorAll('button, input, textarea, select, a');
        interactiveElements.forEach(el => {
            el.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });

            el.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Add drag functionality to the handle
        dragHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startInteractiveDrag(element, e);
        });

        element.appendChild(dragHandle);
    }

    startInteractiveDrag(element, event) {
        this.isDragging = true;
        this.draggedElement = element;

        const rect = element.getBoundingClientRect();
        this.dragStartX = event.clientX - rect.left;
        this.dragStartY = event.clientY - rect.top;
        this.originalX = rect.left;
        this.originalY = rect.top;

        // Add dragging class
        element.classList.add('dragging');

        // Show drag handle during drag
        const dragHandle = element.querySelector('.interactive-drag-handle');
        if (dragHandle) {
            dragHandle.style.opacity = '1';
        }

        // Add event listeners for drag
        document.addEventListener('mousemove', this.handleInteractiveDragMove.bind(this));
        document.addEventListener('mouseup', this.handleInteractiveDragEnd.bind(this));
    }

    handleInteractiveDragMove(event) {
        if (!this.isDragging || !this.draggedElement) return;

        const canvas = document.getElementById('canvasInner');
        const canvasRect = canvas.getBoundingClientRect();

        const newX = event.clientX - canvasRect.left - this.dragStartX;
        const newY = event.clientY - canvasRect.top - this.dragStartY;

        // Constrain to canvas bounds
        const maxX = canvasRect.width - this.draggedElement.offsetWidth;
        const maxY = canvasRect.height - this.draggedElement.offsetHeight;

        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));

        this.draggedElement.style.left = `${constrainedX}px`;
        this.draggedElement.style.top = `${constrainedY}px`;
    }

    handleInteractiveDragEnd(event) {
        if (!this.isDragging || !this.draggedElement) return;

        this.isDragging = false;
        this.draggedElement.classList.remove('dragging');

        // Hide drag handle
        const dragHandle = this.draggedElement.querySelector('.interactive-drag-handle');
        if (dragHandle) {
            dragHandle.style.opacity = '0';
        }

        // Update element position in data
        const elementData = this.pages[this.currentPage].elements.find(el => el.id === this.draggedElement.id);
        if (elementData) {
            elementData.x = parseInt(this.draggedElement.style.left);
            elementData.y = parseInt(this.draggedElement.style.top);
        }

        // Remove event listeners
        document.removeEventListener('mousemove', this.handleInteractiveDragMove.bind(this));
        document.removeEventListener('mouseup', this.handleInteractiveDragEnd.bind(this));

        this.draggedElement = null;
    }

    addElementControls(element) {
        const controls = document.createElement('div');
        controls.className = 'element-controls';
        controls.innerHTML = `
            <button class="element-control-btn" title="Edit" onclick="builder.editElement('${element.id}')">✏️</button>
            <button class="element-control-btn" title="Duplicate" onclick="builder.duplicateElement('${element.id}')">📋</button>
            <button class="element-control-btn" title="Delete" onclick="builder.deleteElement('${element.id}')">🗑️</button>
        `;
        element.appendChild(controls);
    }

    selectElement(element) {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        this.selectedElement = element;
        element.classList.add('selected');
        this.showElementProperties(element);
    }

    handleCanvasClick(e) {
        const element = e.target.closest('.canvas-element');
        if (element) {
            // If clicking on a heading or text element specifically, don't show toolbar
            if ((element.dataset.elementType === 'heading' && e.target.tagName === 'H2') ||
                (element.dataset.elementType === 'text' && e.target.tagName === 'P')) {
                return; // Let the element handle its own click
            }

            this.selectElement(element);
            this.showFloatingToolbar(element, e);
        } else {
            this.deselectElement();
            this.hideFloatingToolbar();
        }
    }

    handleCanvasDoubleClick(e) {
        const element = e.target.closest('.canvas-element');
        if (element && element.contentEditable !== 'false') {
            element.focus();
            this.selectElement(element);
        }
    }

    deselectElement() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.selectedElement = null;
        }
    }

    showFloatingToolbar(element, event) {
        this.selectedElement = element;
        element.classList.add('selected');

        // Position toolbar near the element
        const rect = element.getBoundingClientRect();
        const toolbar = this.floatingToolbar;

        let left = rect.left + rect.width + 10;
        let top = rect.top;

        // Adjust if toolbar would go off screen
        if (left + toolbar.offsetWidth > window.innerWidth) {
            left = rect.left - toolbar.offsetWidth - 10;
        }
        if (top + toolbar.offsetHeight > window.innerHeight) {
            top = window.innerHeight - toolbar.offsetHeight - 10;
        }

        toolbar.style.left = `${left}px`;
        toolbar.style.top = `${top}px`;
        toolbar.classList.add('active');

        // Update toolbar with element's current styles
        this.updateToolbarWithElementStyles(element);
    }

    hideFloatingToolbar() {
        this.floatingToolbar.classList.remove('active');
        this.deselectElement();
    }

    updateToolbarWithElementStyles(element) {
        const content = element.querySelector('h1, h2, h3, h4, h5, h6, p, button, div');
        if (!content) return;

        const styles = window.getComputedStyle(content);

        // Update text color
        document.getElementById('toolbarTextColor').value = this.rgbToHex(styles.color);

        // Update font family
        document.getElementById('toolbarFontFamily').value = styles.fontFamily;

        // Update font size
        const fontSize = parseInt(styles.fontSize);
        document.getElementById('toolbarFontSize').value = fontSize;

        // Update background color
        document.getElementById('toolbarBgColor').value = this.rgbToHex(styles.backgroundColor);

        // Update border radius
        const borderRadius = parseInt(styles.borderRadius);
        document.getElementById('toolbarBorderRadius').value = borderRadius;
        document.querySelector('#toolbarBorderRadius + .range-value').textContent = `${borderRadius}px`;

        // Update padding
        const padding = parseInt(styles.padding);
        document.getElementById('toolbarPadding').value = padding;
        document.querySelector('#toolbarPadding + .range-value').textContent = `${padding}px`;

        // Update margin
        const margin = parseInt(styles.margin);
        document.getElementById('toolbarMargin').value = margin;
        document.querySelector('#toolbarMargin + .range-value').textContent = `${margin}px`;

        // Update alignment buttons
        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.align === styles.textAlign) {
                btn.classList.add('active');
            }
        });

        // Update style buttons
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.classList.remove('active');
            const style = btn.dataset.style;
            if (style === 'bold' && styles.fontWeight === 'bold') {
                btn.classList.add('active');
            } else if (style === 'italic' && styles.fontStyle === 'italic') {
                btn.classList.add('active');
            } else if (style === 'underline' && styles.textDecoration.includes('underline')) {
                btn.classList.add('active');
            }
        });
    }

    // Element movement handlers
    handleElementMouseDown(e) {
        const element = e.target.closest('.canvas-element');
        if (!element) return;

        this.isDragging = true;
        this.dragStartX = e.clientX - element.offsetLeft;
        this.dragStartY = e.clientY - element.offsetTop;
        this.draggedElement = element;

        element.style.cursor = 'grabbing';
        e.preventDefault();
    }

    handleElementMouseMove(e) {
        if (!this.isDragging || !this.draggedElement) return;

        const newX = e.clientX - this.dragStartX;
        const newY = e.clientY - this.dragStartY;

        this.draggedElement.style.left = `${newX}px`;
        this.draggedElement.style.top = `${newY}px`;

        e.preventDefault();
    }

    handleElementMouseUp(e) {
        if (this.isDragging && this.draggedElement) {
            this.isDragging = false;
            this.draggedElement.style.cursor = 'move';
            this.draggedElement = null;

            // Update element data
            this.updateElementPosition();
        }
    }

    // Touch handlers for mobile
    handleElementTouchStart(e) {
        const element = e.target.closest('.canvas-element');
        if (!element) return;

        this.isDragging = true;
        const touch = e.touches[0];
        this.dragStartX = touch.clientX - element.offsetLeft;
        this.dragStartY = touch.clientY - element.offsetTop;
        this.draggedElement = element;

        element.style.cursor = 'grabbing';
    }

    handleElementTouchMove(e) {
        if (!this.isDragging || !this.draggedElement) return;

        const touch = e.touches[0];
        const newX = touch.clientX - this.dragStartX;
        const newY = touch.clientY - this.dragStartY;

        this.draggedElement.style.left = `${newX}px`;
        this.draggedElement.style.top = `${newY}px`;

        e.preventDefault();
    }

    handleElementTouchEnd(e) {
        if (this.isDragging && this.draggedElement) {
            this.isDragging = false;
            this.draggedElement.style.cursor = 'move';
            this.draggedElement = null;

            // Update element data
            this.updateElementPosition();
        }
    }

    updateElementPosition() {
        if (!this.selectedElement) return;

        const rect = this.selectedElement.getBoundingClientRect();
        const canvasRect = document.getElementById('canvasInner').getBoundingClientRect();

        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;

        // Update element data
        const elementId = this.selectedElement.id;
        const elementData = this.pages[this.currentPage].elements.find(el => el.id === elementId);
        if (elementData) {
            elementData.x = x;
            elementData.y = y;

            // Save to localStorage when position is updated
            this.saveToLocalStorage();
        }
    }

    // Toolbar update methods
    updateElementTextColor(color) {
        if (!this.selectedElement) return;
        const content = this.selectedElement.querySelector('h1, h2, h3, h4, h5, h6, p, button, div');
        if (content) {
            content.style.color = color;
        }
    }

    updateElementFontFamily(fontFamily) {
        if (!this.selectedElement) return;
        const content = this.selectedElement.querySelector('h1, h2, h3, h4, h5, h6, p, button, div');
        if (content) {
            content.style.fontFamily = fontFamily;
        }
    }

    updateElementFontSize(size) {
        if (!this.selectedElement) return;
        const content = this.selectedElement.querySelector('h1, h2, h3, h4, h5, h6, p, button, div');
        if (content) {
            content.style.fontSize = `${size}px`;
        }
    }

    decreaseElementFontSize() {
        const input = document.getElementById('toolbarFontSize');
        const currentSize = parseInt(input.value);
        if (currentSize > 8) {
            input.value = currentSize - 1;
            this.updateElementFontSize(currentSize - 1);
        }
    }

    increaseElementFontSize() {
        const input = document.getElementById('toolbarFontSize');
        const currentSize = parseInt(input.value);
        if (currentSize < 72) {
            input.value = currentSize + 1;
            this.updateElementFontSize(currentSize + 1);
        }
    }

    updateElementAlignment(alignment) {
        if (!this.selectedElement) return;
        const content = this.selectedElement.querySelector('h1, h2, h3, h4, h5, h6, p, button, div');
        if (content) {
            content.style.textAlign = alignment;
        }

        // Update button states
        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    toggleElementStyle(style) {
        if (!this.selectedElement) return;
        const content = this.selectedElement.querySelector('h1, h2, h3, h4, h5, h6, p, button, div');
        if (!content) return;

        const button = event.target;
        const isActive = button.classList.contains('active');

        switch (style) {
            case 'bold':
                content.style.fontWeight = isActive ? 'normal' : 'bold';
                break;
            case 'italic':
                content.style.fontStyle = isActive ? 'normal' : 'italic';
                break;
            case 'underline':
                content.style.textDecoration = isActive ? 'none' : 'underline';
                break;
        }

        button.classList.toggle('active');
    }

    updateElementBackgroundColor(color) {
        if (!this.selectedElement) return;
        this.selectedElement.style.backgroundColor = color;
    }

    updateElementBorderRadius(radius) {
        if (!this.selectedElement) return;
        this.selectedElement.style.borderRadius = `${radius}px`;
        document.querySelector('#toolbarBorderRadius + .range-value').textContent = `${radius}px`;
    }

    updateElementPadding(padding) {
        if (!this.selectedElement) return;
        this.selectedElement.style.padding = `${padding}px`;
        document.querySelector('#toolbarPadding + .range-value').textContent = `${padding}px`;
    }

    updateElementMargin(margin) {
        if (!this.selectedElement) return;
        this.selectedElement.style.margin = `${margin}px`;
        document.querySelector('#toolbarMargin + .range-value').textContent = `${margin}px`;
    }

    duplicateSelectedElement() {
        if (!this.selectedElement) return;
        this.duplicateElement(this.selectedElement.id);
    }

    deleteSelectedElement() {
        if (!this.selectedElement) return;
        this.deleteElement(this.selectedElement.id);
        this.hideFloatingToolbar();
    }

    addLinkToElement() {
        if (!this.selectedElement) return;
        const url = prompt('Enter URL:');
        if (url) {
            const content = this.selectedElement.querySelector('h1, h2, h3, h4, h5, h6, p, button, div');
            if (content) {
                content.innerHTML = `<a href="${url}" target="_blank">${content.innerHTML}</a>`;
            }
        }
    }

    // Global control methods
    applyGlobalFont(fontFamily) {
        document.querySelectorAll('.canvas-element').forEach(element => {
            const content = element.querySelector('h1, h2, h3, h4, h5, h6, p, button, div');
            if (content) {
                content.style.fontFamily = fontFamily;
            }
        });
    }

    decreaseGlobalFontSize() {
        const currentSize = parseInt(document.getElementById('currentSize').textContent);
        if (currentSize > 12) {
            const newSize = currentSize - 2;
            document.getElementById('currentSize').textContent = `${newSize}px`;
            this.applyGlobalFontSize(newSize);
        }
    }

    increaseGlobalFontSize() {
        const currentSize = parseInt(document.getElementById('currentSize').textContent);
        if (currentSize < 32) {
            const newSize = currentSize + 2;
            document.getElementById('currentSize').textContent = `${newSize}px`;
            this.applyGlobalFontSize(newSize);
        }
    }

    applyGlobalFontSize(size) {
        document.querySelectorAll('.canvas-element').forEach(element => {
            const content = element.querySelector('h1, h2, h3, h4, h5, h6, p, button, div');
            if (content) {
                const currentSize = parseInt(window.getComputedStyle(content).fontSize);
                const ratio = size / 16; // Base size is 16px
                content.style.fontSize = `${currentSize * ratio}px`;
            }
        });
    }

    // toggleDarkMode() - removed with theme panel

    undo() {
        // TODO: Implement undo functionality
        this.showNotification('Undo functionality coming soon!', 'info');
    }

    redo() {
        // TODO: Implement redo functionality
        this.showNotification('Redo functionality coming soon!', 'info');
    }

    // Utility methods
    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!rgbMatch) return '#000000';

        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);

        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    showElementProperties(element) {
        // This would show element-specific properties in the right sidebar
        // For now, we'll just highlight the element
        console.log('Selected element:', element);
    }

    editElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (element.dataset.elementType === 'form') {
            this.showFormConfigModal(element);
        } else {
            // For other elements, just select them
            this.selectElement(element);
        }
    }

    showFormConfigModal(element) {
        const modal = document.getElementById('formConfigModal');
        const elementId = element.id;

        // Get current admin email for this specific form
        const currentEmail = localStorage.getItem(`contactFormEmail_${elementId}`) || '';
        const currentTitle = element.querySelector('.form-title').textContent;

        // Set current values
        document.getElementById('formTitle').value = currentTitle;
        document.getElementById('formEmail').value = currentEmail;

        // Store reference to the element being edited
        modal.dataset.editingElement = elementId;

        modal.classList.add('active');
    }

    hideFormConfigModal() {
        const modal = document.getElementById('formConfigModal');
        modal.classList.remove('active');
        modal.dataset.editingElement = '';
    }

    saveFormConfig() {
        const modal = document.getElementById('formConfigModal');
        const elementId = modal.dataset.editingElement;
        const element = document.getElementById(elementId);

        if (!element) return;

        const title = document.getElementById('formTitle').value;
        const email = document.getElementById('formEmail').value;

        // Update form title
        const formTitle = element.querySelector('.form-title');
        if (formTitle) {
            formTitle.textContent = title;
        }

        // Save admin email to localStorage for this specific form
        if (email) {
            localStorage.setItem(`contactFormEmail_${elementId}`, email);
        } else {
            localStorage.removeItem(`contactFormEmail_${elementId}`);
        }

        // Update element data in pages object
        const elementData = this.pages[this.currentPage].elements.find(el => el.id === elementId);
        if (elementData) {
            elementData.content = element.innerHTML;
        }

        this.hideFormConfigModal();
        this.showNotification('Contact form configuration saved!', 'success');
    }

    handleContactFormSubmit(e, element) {
        e.preventDefault();

        const form = element.querySelector('.contact-form');
        const warningDiv = element.querySelector('.email-warning');

        // Get admin email from localStorage for this specific form element
        const elementId = element.id;
        const adminEmail = localStorage.getItem(`contactFormEmail_${elementId}`);

        if (!adminEmail) {
            // Show warning if no admin email is attached
            warningDiv.style.display = 'block';
            this.showNotification('Please attach your admin email to this contact form using the Edit Panel.', 'error');
            return;
        }

        // Hide warning if email is set
        warningDiv.style.display = 'none';

        // Get form data
        const formData = new FormData(form);
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const message = formData.get('message');

        // Validate form data
        if (!fullName || !email || !message) {
            this.showNotification('Please fill in all fields!', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('Please enter a valid email address!', 'error');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';

        // Simulate email sending with detailed logging
        setTimeout(() => {
            // Create email content for logging
            const emailContent = `
                New Contact Form Submission
                
                From: ${fullName} (${email})
                Message: ${message}
                
                Sent to: ${adminEmail}
                Date: ${new Date().toLocaleString()}
            `;

            // Log the submission details
            console.log('Contact Form Submission:', {
                from: { name: fullName, email: email },
                message: message,
                to: adminEmail,
                timestamp: new Date().toISOString()
            });

            // Show success message
            this.showNotification('Thank you for contacting us! We\'ll get back to you soon.', 'success');

            // Reset form
            form.reset();

            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }, 1500); // Simulate network delay
    }



    setupSidebarToggles() {
        document.getElementById('leftSidebarToggle').addEventListener('click', () => {
            document.getElementById('elementsPanel').classList.toggle('collapsed');
        });

        document.getElementById('rightSidebarToggle').addEventListener('click', () => {
            document.getElementById('layerPanel').classList.toggle('collapsed');
        });
    }

    setupFAB() {
        const fabMain = document.getElementById('fabMain');
        const fabMenu = document.getElementById('fabMenu');

        fabMain.addEventListener('click', () => {
            fabMenu.classList.toggle('active');
        });

        // FAB menu items
        document.querySelectorAll('.fab-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                switch (action) {
                    case 'save':
                        this.saveProject();
                        break;
                    case 'export':
                        this.exportWebsite();
                        break;

                    case 'layers':
                        document.getElementById('layerPanel').classList.toggle('collapsed');
                        break;
                }
                fabMenu.classList.remove('active');
            });
        });
    }

    setupModals() {
        // Add page modal
        document.getElementById('addPageBtn').addEventListener('click', () => this.showAddPageModal());
        document.getElementById('closeAddPageModal').addEventListener('click', () => this.hideAddPageModal());
        document.getElementById('cancelAddPage').addEventListener('click', () => this.hideAddPageModal());
        document.getElementById('confirmAddPage').addEventListener('click', () => this.addNewPage());

        // Export modal
        document.getElementById('exportBtn').addEventListener('click', () => this.showExportModal());
        document.getElementById('closeExportModal').addEventListener('click', () => this.hideExportModal());
        document.getElementById('cancelExport').addEventListener('click', () => this.hideExportModal());
        document.getElementById('confirmExport').addEventListener('click', () => this.executeExport());

        // Export options
        document.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectExportOption(e.target.closest('.export-option')));
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Form configuration modal
        document.getElementById('closeFormConfigModal').addEventListener('click', () => this.hideFormConfigModal());
        document.getElementById('cancelFormConfig').addEventListener('click', () => this.hideFormConfigModal());
        document.getElementById('saveFormConfig').addEventListener('click', () => this.saveFormConfig());
    }

    showAddPageModal() {
        document.getElementById('addPageModal').classList.add('active');
        document.getElementById('newPageName').focus();
    }

    hideAddPageModal() {
        document.getElementById('addPageModal').classList.remove('active');
    }

    showExportModal() {
        document.getElementById('exportModal').classList.add('active');
        // Default selection
        this.selectExportOption(document.querySelector('.export-option[data-export="zip"]'));
    }

    hideExportModal() {
        document.getElementById('exportModal').classList.remove('active');
    }

    selectExportOption(option) {
        document.querySelectorAll('.export-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedExportType = option.dataset.export;
    }

    executeExport() {
        const exportType = this.selectedExportType || 'zip';
        const includeAssets = document.getElementById('includeAssets').checked;
        const minifyCode = document.getElementById('minifyCode').checked;
        const addComments = document.getElementById('addComments').checked;

        switch (exportType) {
            case 'html':
                this.exportAsSingleHTML(includeAssets, minifyCode, addComments);
                break;
            case 'separate':
                this.exportAsSeparateFiles(includeAssets, minifyCode, addComments);
                break;
            case 'zip':
                this.exportAsZIP(includeAssets, minifyCode, addComments);
                break;
        }

        this.hideExportModal();
    }

    exportAsSingleHTML(includeAssets, minifyCode, addComments) {
        const html = this.generateCompleteHTML(includeAssets, minifyCode, addComments);
        this.downloadFile('website.html', html, 'text/html');
        this.showNotification('Website exported as single HTML file!', 'success');
    }

    exportAsSeparateFiles(includeAssets, minifyCode, addComments) {
        const html = this.generateHTML(includeAssets, minifyCode, addComments);
        const css = this.generateCSS(includeAssets, minifyCode, addComments);
        const js = this.generateJS(includeAssets, minifyCode, addComments);

        this.downloadFile('index.html', html, 'text/html');
        this.downloadFile('styles.css', css, 'text/css');
        this.downloadFile('script.js', js, 'text/javascript');

        this.showNotification('Website exported as separate files!', 'success');
    }

    exportAsZIP(includeAssets, minifyCode, addComments) {
        // This would require JSZip library - for now, we'll use separate files
        this.exportAsSeparateFiles(includeAssets, minifyCode, addComments);
        this.showNotification('ZIP export coming soon! Using separate files for now.', 'info');
    }

    generateCompleteHTML(includeAssets, minifyCode, addComments) {
        const html = this.generateHTML(includeAssets, minifyCode, addComments);
        const css = this.generateCSS(includeAssets, minifyCode, addComments);
        const js = this.generateJS(includeAssets, minifyCode, addComments);

        return html.replace('</head>', `<style>${css}</style></head>`)
            .replace('</body>', `<script>${js}</script></body>`);
    }

    generateJS(includeAssets, minifyCode, addComments) {
        let js = '';

        if (addComments) {
            js += `// Generated by Hit-X Coding\n`;
            js += `// Website JavaScript\n\n`;
        }

        js += `// Smooth scrolling for navigation links\n`;
        js += `document.querySelectorAll('a[href^="#"]').forEach(anchor => {\n`;
        js += `    anchor.addEventListener('click', function (e) {\n`;
        js += `        e.preventDefault();\n`;
        js += `        const target = document.querySelector(this.getAttribute('href'));\n`;
        js += `        if (target) {\n`;
        js += `            target.scrollIntoView({ behavior: 'smooth' });\n`;
        js += `        }\n`;
        js += `    });\n`;
        js += `});\n\n`;

        js += `// Contact Form submission handling\n`;
        js += `document.querySelectorAll('.contact-form').forEach(form => {\n`;
        js += `    form.addEventListener('submit', function(e) {\n`;
        js += `        e.preventDefault();\n`;
        js += `        \n`;
        js += `        // Get admin email from localStorage for this specific form element\n`;
        js += `        const formContainer = form.closest('.contact-form-container');\n`;
        js += `        const elementId = formContainer.id || 'default';\n`;
        js += `        const adminEmail = localStorage.getItem('contactFormEmail_' + elementId);\n`;
        js += `        \n`;
        js += `        if (!adminEmail) {\n`;
        js += `            alert('Please attach your admin email to this contact form using the Edit Panel.');\n`;
        js += `            return;\n`;
        js += `        }\n`;
        js += `        \n`;
        js += `        // Get form data\n`;
        js += `        const formData = new FormData(form);\n`;
        js += `        const fullName = formData.get('fullName');\n`;
        js += `        const email = formData.get('email');\n`;
        js += `        const message = formData.get('message');\n`;
        js += `        \n`;
        js += `        // Validate form data\n`;
        js += `        if (!fullName || !email || !message) {\n`;
        js += `            alert('Please fill in all fields!');\n`;
        js += `            return;\n`;
        js += `        }\n`;
        js += `        \n`;
        js += `        // Validate email format\n`;
        js += `        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n`;
        js += `        if (!emailRegex.test(email)) {\n`;
        js += `            alert('Please enter a valid email address!');\n`;
        js += `            return;\n`;
        js += `        }\n`;
        js += `        \n`;
        js += `        // Show loading state\n`;
        js += `        const submitBtn = form.querySelector('.submit-btn');\n`;
        js += `        const originalText = submitBtn.textContent;\n`;
        js += `        submitBtn.textContent = 'Sending...';\n`;
        js += `        submitBtn.disabled = true;\n`;
        js += `        \n`;
        js += `        // Simulate email sending with detailed logging\n`;
        js += `        setTimeout(() => {\n`;
        js += `            // Create email content for logging\n`;
        js += `            const emailContent = \`\n`;
        js += `                New Contact Form Submission\n`;
        js += `                \n`;
        js += `                From: \${fullName} (\${email})\n`;
        js += `                Message: \${message}\n`;
        js += `                \n`;
        js += `                Sent to: \${adminEmail}\n`;
        js += `                Date: \${new Date().toLocaleString()}\n`;
        js += `            \`;\n`;
        js += `            \n`;
        js += `            // Log the submission details\n`;
        js += `            console.log('Contact Form Submission:', {\n`;
        js += `                from: { name: fullName, email: email },\n`;
        js += `                message: message,\n`;
        js += `                to: adminEmail,\n`;
        js += `                timestamp: new Date().toISOString()\n`;
        js += `            });\n`;
        js += `            \n`;
        js += `            // Show success message\n`;
        js += `            alert('Thank you for contacting us! We\\'ll get back to you soon.');\n`;
        js += `            \n`;
        js += `            // Reset form\n`;
        js += `            form.reset();\n`;
        js += `            \n`;
        js += `            // Reset button state\n`;
        js += `            submitBtn.textContent = originalText;\n`;
        js += `            submitBtn.disabled = false;\n`;
        js += `        }, 1500); // Simulate network delay\n`;
        js += `    });\n`;
        js += `});\n\n`;

        js += `// Add any additional interactive features here\n`;
        js += `console.log('Website loaded successfully!');\n`;

        if (minifyCode) {
            // Basic minification - remove comments and extra whitespace
            js = js.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim();
        }

        return js;
    }







    downloadFile(filename, content, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    addNewPage() {
        const pageName = document.getElementById('newPageName').value.trim();
        const template = document.getElementById('newPageTemplate').value;

        if (!pageName) {
            alert('Please enter a page name');
            return;
        }

        const pageId = pageName.toLowerCase().replace(/\s+/g, '-');

        // Add to pages object
        this.pages[pageId] = {
            elements: [],
            styles: {}
        };

        // Add to page selector
        const selector = document.getElementById('pageSelector');
        const option = document.createElement('option');
        option.value = pageId;
        option.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
        selector.appendChild(option);

        // Switch to new page
        this.switchPage(pageId);

        // Close modal
        document.getElementById('addPageModal').classList.remove('active');
        document.getElementById('newPageName').value = '';
    }

    switchPage(pageId) {
        this.currentPage = pageId;
        document.getElementById('pageSelector').value = pageId;
        this.loadPageContent(pageId);
    }

    loadPageContent(pageId) {
        const canvas = document.getElementById('canvasInner');
        canvas.innerHTML = '';

        // Ensure the page exists
        if (!this.pages[pageId]) {
            this.pages[pageId] = { elements: [], styles: {} };
        }

        if (this.pages[pageId].elements.length === 0) {
            canvas.innerHTML = `
                <div class="canvas-placeholder">
                    <div class="placeholder-icon">🎨</div>
                    <h3>Start Building Your Website</h3>
                    <p>Drag elements from the left sidebar to begin creating your website</p>
                </div>
            `;
        } else {
            console.log(`Loading ${this.pages[pageId].elements.length} elements for page: ${pageId}`);
            this.pages[pageId].elements.forEach((elementData, index) => {
                try {
                    const element = this.createElementFromData(elementData);
                    canvas.appendChild(element);
                    console.log(`Loaded element ${index + 1}: ${elementData.type} (${elementData.id})`);
                } catch (error) {
                    console.error(`Error loading element ${index + 1}:`, error);
                }
            });
        }

        // Update layer panel after loading all elements
        if (this.layerManager) {
            this.layerManager.renderLayerList();
        }
    }

    createElementFromData(elementData) {
        const element = this.createElement(elementData.type);
        element.id = elementData.id;
        element.style.left = `${elementData.x}px`;
        element.style.top = `${elementData.y}px`;
        element.style.position = 'absolute';
        element.innerHTML = elementData.content;

        // Apply saved styles
        Object.assign(element.style, elementData.styles);

        // Create layer for the loaded element
        this.layerManager.createLayer(element, elementData);

        // Re-setup form functionality if it's a form element
        if (elementData.type === 'form') {
            const form = element.querySelector('.contact-form');
            if (form) {
                // Re-add form submission handler
                form.addEventListener('submit', (e) => this.handleContactFormSubmit(e, element));

                // Re-setup form title editing
                const formTitle = element.querySelector('.form-title');
                if (formTitle) {
                    formTitle.addEventListener('focus', () => {
                        formTitle.style.border = '1px solid #667eea';
                        formTitle.style.backgroundColor = 'rgba(255,255,255,0.9)';
                    });
                    formTitle.addEventListener('blur', () => {
                        formTitle.style.border = '1px solid transparent';
                        formTitle.style.backgroundColor = 'transparent';
                    });
                }

                // Re-setup submit button text editing
                const submitBtnEditable = element.querySelector('.submit-btn');
                if (submitBtnEditable) {
                    submitBtnEditable.addEventListener('focus', () => {
                        submitBtnEditable.style.border = '1px solid #667eea';
                        submitBtnEditable.style.backgroundColor = 'rgba(255,255,255,0.9)';
                    });
                    submitBtnEditable.addEventListener('blur', () => {
                        submitBtnEditable.style.border = '1px solid transparent';
                        submitBtnEditable.style.backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    });
                }

                // Re-setup input focus effects
                const inputs = element.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    input.addEventListener('focus', () => {
                        input.style.borderColor = '#667eea';
                        input.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    });
                    input.addEventListener('blur', () => {
                        input.style.borderColor = '#e1e5e9';
                        input.style.boxShadow = 'none';
                    });
                });

                // Re-setup submit button hover effects
                const submitBtn = element.querySelector('.submit-btn');
                if (submitBtn) {
                    submitBtn.addEventListener('mouseenter', () => {
                        submitBtn.style.transform = 'translateY(-2px)';
                        submitBtn.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
                    });
                    submitBtn.addEventListener('mouseleave', () => {
                        submitBtn.style.transform = 'translateY(0)';
                        submitBtn.style.boxShadow = 'none';
                    });
                }
            }
        }

        // Re-setup heading editing functionality if it's a heading element
        if (elementData.type === 'heading') {
            const heading = element.querySelector('h2');
            if (heading) {
                heading.contentEditable = 'true';
                heading.style.outline = 'none';
                heading.style.border = '1px solid transparent';
                heading.style.padding = '5px';
                heading.style.cursor = 'text';

                // Add click-to-edit functionality
                heading.addEventListener('click', (e) => {
                    e.stopPropagation();
                    heading.focus();
                    this.selectElement(element);
                });

                heading.addEventListener('focus', () => {
                    heading.style.border = '1px solid var(--primary-red)';
                    heading.style.backgroundColor = 'rgba(255,255,255,0.9)';
                    heading.style.color = '#333';
                });

                heading.addEventListener('blur', () => {
                    heading.style.border = '1px solid transparent';
                    heading.style.backgroundColor = 'transparent';
                    heading.style.color = '#333333';
                });

                // Prevent element controls from interfering with heading editing
                heading.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });

                // Prevent backspace from removing elements when editing text
                heading.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.stopPropagation();
                    }
                });
            }
        }

        // Re-setup text editing functionality if it's a text element
        if (elementData.type === 'text') {
            const textElement = element.querySelector('p');
            if (textElement) {
                textElement.contentEditable = 'true';
                textElement.style.outline = 'none';
                textElement.style.border = '1px solid transparent';
                textElement.style.padding = '5px';
                textElement.style.cursor = 'text';

                // Add click-to-edit functionality
                textElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    textElement.focus();
                    this.selectElement(element);
                });

                textElement.addEventListener('focus', () => {
                    textElement.style.border = '1px solid var(--primary-red)';
                    textElement.style.backgroundColor = 'rgba(255,255,255,0.9)';
                    textElement.style.color = '#333';
                });

                textElement.addEventListener('blur', () => {
                    textElement.style.border = '1px solid transparent';
                    textElement.style.backgroundColor = 'transparent';
                    textElement.style.color = '#333333';
                });

                // Prevent element controls from interfering with text editing
                textElement.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });

                // Prevent backspace from removing elements when editing text
                textElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.stopPropagation();
                    }
                });
            }
        }

        // Re-setup video functionality if it's a video element
        if (elementData.type === 'video') {
            // Check if the video element has uploaded content or is still placeholder
            const videoElement = element.querySelector('video');
            if (!videoElement) {
                // If no video element found, it's still a placeholder, add click handler
                element.addEventListener('click', () => this.uploadVideo(element));
            }
        }

        // Add interactive drag handles for interactive elements (except forms and links)
        if (elementData.type === 'button') {
            this.addInteractiveDragHandle(element, elementData.type);
        }

        return element;
    }

    switchView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        const canvas = document.getElementById('canvas');
        canvas.className = `canvas view-${view}`;

        // Apply view-specific styles
        switch (view) {
            case 'mobile':
                canvas.style.maxWidth = '375px';
                break;
            case 'tablet':
                canvas.style.maxWidth = '768px';
                break;
            case 'desktop':
                canvas.style.maxWidth = '1200px';
                break;
        }
    }

    saveProject() {
        const projectData = {
            pages: this.pages,
            currentPage: this.currentPage,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hitx-project-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.saveToLocalStorage();
        this.showNotification('Project saved successfully!', 'success');
    }

    loadProject() {
        const input = document.getElementById('loadFileInput');
        input.click();

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const projectData = JSON.parse(e.target.result);
                        this.pages = projectData.pages;
                        this.currentPage = projectData.currentPage || 'home';

                        this.updatePageSelector();
                        this.switchPage(this.currentPage);

                        this.showNotification('Project loaded successfully!', 'success');
                    } catch (error) {
                        this.showNotification('Error loading project file', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    updatePageSelector() {
        const selector = document.getElementById('pageSelector');
        selector.innerHTML = '';

        Object.keys(this.pages).forEach(pageId => {
            const option = document.createElement('option');
            option.value = pageId;
            option.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
            selector.appendChild(option);
        });

        // Set the current page as selected
        if (this.currentPage && selector.value !== this.currentPage) {
            selector.value = this.currentPage;
        }
    }

    exportWebsite() {
        const html = this.generateHTML();
        const css = this.generateCSS();

        // Export as separate files since JSZip is not included
        this.downloadFile('index.html', html, 'text/html');
        this.downloadFile('style.css', css, 'text/css');

        this.showNotification('Website exported as separate files!', 'success');
    }

    generateHTML() {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">
                <span class="logo-text">My Website</span>
            </div>
            <ul class="nav-menu">
`;

        // Generate navigation
        Object.keys(this.pages).forEach(pageId => {
            const pageName = pageId.charAt(0).toUpperCase() + pageId.slice(1);
            html += `                <li><a href="#${pageId}" class="nav-link">${pageName}</a></li>\n`;
        });

        html += `            </ul>
        </div>
    </nav>

    <main>
`;

        // Generate page content
        Object.keys(this.pages).forEach(pageId => {
            html += `        <section id="${pageId}" class="page">
            <div class="container">
`;

            this.pages[pageId].elements.forEach(element => {
                html += `                ${element.content}\n`;
            });

            html += `            </div>
        </section>
`;
        });

        html += `    </main>

    <script>
        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    </script>
</body>
</html>`;

        return html;
    }

    generateCSS() {
        return `/* Generated by Hit-X Coding */
:root {
    --primary-color: #ff0066;
    --secondary-color: #0066ff;
    --background-color: #ffffff;
    --text-color: #333333;
    --heading-text-color: #1a1a1a;
    --body-text-color: #333333;
    --border-radius: 8px;
    --spacing-scale: 16px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', sans-serif;
    background-color: var(--background-color);
    color: var(--body-text-color);
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.navbar {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 70px;
}

.nav-logo .logo-text {
    font-family: 'Inter', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 30px;
}

.nav-link {
    color: var(--body-text-color);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-link:hover {
    color: var(--primary-color);
}

.page {
    padding: 100px 0;
    min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
    font-family: 'Inter', sans-serif;
    margin-bottom: 1rem;
    color: var(--heading-text-color);
}

h1 { font-size: 3rem; }
h2 { font-size: 2.5rem; }
h3 { font-size: 2rem; }
h4 { font-size: 1.5rem; }
h5 { font-size: 1.25rem; }
h6 { font-size: 1rem; }

p {
    margin-bottom: 1rem;
    font-size: 1rem;
    color: var(--body-text-color);
}

button {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
}

button:hover {
    background: var(--secondary-color);
    transform: translateY(-2px);
}

/* Contact Form Styles */
.contact-form-container {
    background: #ffffff;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    margin: 0 auto;
    font-family: 'Inter', sans-serif;
}

.form-header {
    text-align: center;
    margin-bottom: 30px;
}

.form-title {
    color: #1a1a1a;
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 10px 0;
}



.contact-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    position: relative;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 15px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 16px;
    font-family: inherit;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
    resize: vertical;
    min-height: 120px;
}

.submit-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 30px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

.email-warning {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
    padding: 15px;
    border-radius: 8px;
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav-menu {
        display: none;
    }
    
    h1 { font-size: 2rem; }
    h2 { font-size: 1.75rem; }
    h3 { font-size: 1.5rem; }
    
    .container {
        padding: 0 15px;
    }
    
    /* Contact Form Mobile Styles */
    .contact-form-container {
        padding: 30px 20px;
        margin: 0 15px;
        max-width: none;
    }
    
    .form-title {
        font-size: 24px;
    }
    
    .form-subtitle {
        font-size: 14px;
    }
    
    .form-group input,
    .form-group textarea {
        padding: 12px;
        font-size: 16px; /* Prevents zoom on iOS */
    }
    
    .submit-btn {
        padding: 12px 24px;
        font-size: 16px;
    }
}

@media (max-width: 480px) {
    .contact-form-container {
        padding: 20px 15px;
    }
    
    .form-title {
        font-size: 20px;
    }
    
    .form-subtitle {
        font-size: 13px;
    }
}`;
    }



    updateLayerPanel() {
        const layerList = document.getElementById('layerList');
        layerList.innerHTML = '';

        this.pages[this.currentPage].elements.forEach((element, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.innerHTML = `
                <span>${element.type} ${index + 1}</span>
                <div class="layer-controls">
                    <button onclick="builder.selectElementById('${element.id}')">👁️</button>
                    <button onclick="builder.deleteElement('${element.id}')">🗑️</button>
                </div>
            `;
            layerList.appendChild(layerItem);
        });
    }

    selectElementById(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            this.selectElement(element);
        }
    }

    deleteElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.remove();

            // Remove from page data
            this.pages[this.currentPage].elements = this.pages[this.currentPage].elements.filter(
                el => el.id !== elementId
            );

            // Update layer panel
            if (this.layerManager) {
                this.layerManager.renderLayerList();
            }

            // Save to localStorage
            this.saveToLocalStorage();
        }
    }

    duplicateElement(elementId) {
        const originalElement = document.getElementById(elementId);
        if (originalElement) {
            const elementData = this.pages[this.currentPage].elements.find(el => el.id === elementId);
            if (elementData) {
                const newElementData = {
                    ...elementData,
                    id: `element-${++this.elementCounter}`,
                    x: elementData.x + 20,
                    y: elementData.y + 20
                };

                this.pages[this.currentPage].elements.push(newElementData);

                const newElement = this.createElementFromData(newElementData);
                document.getElementById('canvasInner').appendChild(newElement);

                // Update layer panel
                if (this.layerManager) {
                    this.layerManager.renderLayerList();
                }

                // Save to localStorage
                this.saveToLocalStorage();
            }
        }
    }

    uploadImage(element) {
        const input = document.getElementById('imageUploadInput');
        input.click();

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    element.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; height: auto; border-radius: var(--border-radius);" alt="Uploaded image">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    uploadVideo(element) {
        const input = document.getElementById('videoUploadInput');
        input.click();

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    element.innerHTML = `<video controls style="max-width: 100%; height: auto; border-radius: var(--border-radius);"><source src="${e.target.result}" type="${file.type}">Your browser does not support the video tag.</video>`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveProject();
                    break;
                case 'z':
                    e.preventDefault();
                    // Undo functionality (to be implemented)
                    break;
                case 'y':
                    e.preventDefault();
                    // Redo functionality (to be implemented)
                    break;
                case 'd':
                    e.preventDefault();
                    if (this.selectedElement) {
                        this.duplicateElement(this.selectedElement.id);
                    }
                    break;
            }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.selectedElement) {
                this.deleteElement(this.selectedElement.id);
            }
        }
    }

    saveToLocalStorage() {
        const projectData = {
            pages: this.pages,
            currentPage: this.currentPage
        };

        try {
            localStorage.setItem('hitxProject', JSON.stringify(projectData));
            console.log('Project saved to localStorage:', {
                pages: Object.keys(this.pages),
                currentPage: this.currentPage,
                totalElements: Object.values(this.pages).reduce((sum, page) => sum + page.elements.length, 0)
            });
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('hitxProject');
        if (saved) {
            try {
                const projectData = JSON.parse(saved);

                // Load saved pages data
                if (projectData.pages) {
                    this.pages = projectData.pages;
                }

                // Load current page
                if (projectData.currentPage) {
                    this.currentPage = projectData.currentPage;
                }

                // Ensure we have at least a home page
                if (!this.pages.home) {
                    this.pages.home = { elements: [], styles: {} };
                }

                console.log('Project loaded from localStorage:', {
                    pages: Object.keys(this.pages),
                    currentPage: this.currentPage,
                    totalElements: Object.values(this.pages).reduce((sum, page) => sum + page.elements.length, 0)
                });

            } catch (error) {
                console.error('Error loading from localStorage:', error);
                // Fallback to default state
                this.pages = { home: { elements: [], styles: {} } };
                this.currentPage = 'home';
            }
        } else {
            console.log('No saved project found, starting fresh');
        }
    }

    autoSave() {
        this.saveToLocalStorage();
    }

    removePlaceholder() {
        const placeholder = document.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
    }

    getElementStyles(element) {
        const styles = {};
        const computedStyle = window.getComputedStyle(element);

        // Get relevant styles
        const relevantStyles = [
            'color', 'background-color', 'font-size', 'font-weight', 'font-family',
            'padding', 'margin', 'border', 'border-radius', 'width', 'height',
            'text-align', 'display', 'position', 'top', 'left'
        ];

        relevantStyles.forEach(style => {
            styles[style] = computedStyle.getPropertyValue(style);
        });

        return styles;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'linear-gradient(45deg, #00ff88, #00cc6a)' :
                type === 'error' ? 'linear-gradient(45deg, #ff0066, #cc0052)' :
                    'linear-gradient(45deg, #0066ff, #0052cc)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }

    setupFloatingToolbar() {
        this.floatingToolbar = document.getElementById('floatingToolbar');
        this.selectedElement = null;
        this.isDragging = false;

        // Toolbar controls
        document.getElementById('toolbarClose').addEventListener('click', () => this.hideFloatingToolbar());

        // Text styling controls
        document.getElementById('toolbarTextColor').addEventListener('change', (e) => this.updateElementTextColor(e.target.value));
        document.getElementById('toolbarFontFamily').addEventListener('change', (e) => this.updateElementFontFamily(e.target.value));
        document.getElementById('toolbarFontSize').addEventListener('input', (e) => this.updateElementFontSize(e.target.value));
        document.getElementById('toolbarDecreaseSize').addEventListener('click', () => this.decreaseElementFontSize());
        document.getElementById('toolbarIncreaseSize').addEventListener('click', () => this.increaseElementFontSize());

        // Alignment controls
        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.updateElementAlignment(e.target.dataset.align));
        });

        // Style controls
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleElementStyle(e.target.dataset.style));
        });

        // Background and border controls
        document.getElementById('toolbarBgColor').addEventListener('change', (e) => this.updateElementBackgroundColor(e.target.value));
        document.getElementById('toolbarBorderRadius').addEventListener('input', (e) => this.updateElementBorderRadius(e.target.value));

        // Spacing controls
        document.getElementById('toolbarPadding').addEventListener('input', (e) => this.updateElementPadding(e.target.value));
        document.getElementById('toolbarMargin').addEventListener('input', (e) => this.updateElementMargin(e.target.value));

        // Action controls
        document.getElementById('toolbarDuplicate').addEventListener('click', () => this.duplicateSelectedElement());
        document.getElementById('toolbarDelete').addEventListener('click', () => this.deleteSelectedElement());
        document.getElementById('toolbarLink').addEventListener('click', () => this.addLinkToElement());

        // Hide toolbar when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.floatingToolbar.contains(e.target) && !e.target.closest('.canvas-element')) {
                this.hideFloatingToolbar();
            }
        });
    }

    setupGlobalControls() {
        // Global size controls
        document.getElementById('decreaseSize').addEventListener('click', () => this.decreaseGlobalFontSize());
        document.getElementById('increaseSize').addEventListener('click', () => this.increaseGlobalFontSize());

        // Global theme selector - removed with theme panel

        // Theme toggle - removed with theme panel

        // Undo/Redo
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
    }

    setupMovableElements() {
        const canvas = document.getElementById('canvasInner');

        canvas.addEventListener('mousedown', (e) => this.handleElementMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleElementMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleElementMouseUp(e));

        // Touch support for mobile
        canvas.addEventListener('touchstart', (e) => this.handleElementTouchStart(e));
        document.addEventListener('touchmove', (e) => this.handleElementTouchMove(e));
        document.addEventListener('touchend', (e) => this.handleElementTouchEnd(e));
    }
}

// Theme Management System
class LayerManager {
    constructor(builder) {
        this.builder = builder;
        this.layers = [];
        this.nextLayerId = 1;
        this.draggedLayer = null;
        this.init();
    }

    init() {
        this.layerList = document.getElementById('layerList');
        this.layerCount = document.getElementById('layerCount');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Layer control buttons
        document.getElementById('expandAllLayers').addEventListener('click', () => this.expandAllLayers());
        document.getElementById('collapseAllLayers').addEventListener('click', () => this.collapseAllLayers());
        document.getElementById('selectAllLayers').addEventListener('click', () => this.selectAllLayers());

        // Drag and drop for layer reordering
        this.layerList.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.layerList.addEventListener('drop', (e) => this.handleDrop(e));
        this.layerList.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    }

    createLayer(element, elementData) {
        const layerId = `layer-${this.nextLayerId++}`;
        const layer = {
            id: layerId,
            elementId: elementData.id,
            name: this.generateLayerName(elementData.type),
            type: elementData.type,
            visible: true,
            locked: false,
            element: element,
            data: elementData
        };

        this.layers.push(layer);
        this.renderLayer(layer);
        this.updateLayerCount();
        return layer;
    }

    generateLayerName(type) {
        const typeCount = this.layers.filter(l => l.type === type).length + 1;
        const typeNames = {
            heading: 'Heading',
            text: 'Text',
            button: 'Button',
            image: 'Image',
            form: 'Form',
            divider: 'Divider',
            container: 'Container',
            link: 'Link',
            spacer: 'Spacer',
            section: 'Section'
        };
        return `${typeNames[type] || 'Element'} ${typeCount}`;
    }

    renderLayer(layer) {
        const layerElement = document.createElement('div');
        layerElement.className = 'layer-item';
        layerElement.dataset.layerId = layer.id;
        layerElement.draggable = true;

        const icon = this.getLayerIcon(layer.type);

        layerElement.innerHTML = `
            <div class="layer-drag-handle" title="Drag to reorder">⋮⋮</div>
            <div class="layer-icon">${icon}</div>
            <div class="layer-name" contenteditable="false">${layer.name}</div>
            <div class="layer-actions">
                <button class="layer-action-btn visibility ${layer.visible ? '' : 'hidden'}" title="${layer.visible ? 'Hide' : 'Show'}">
                    ${layer.visible ? '👁️' : '🚫'}
                </button>
                <button class="layer-action-btn lock ${layer.locked ? 'locked' : ''}" title="${layer.locked ? 'Unlock' : 'Lock'}">
                    ${layer.locked ? '🔒' : '🔓'}
                </button>
                <button class="layer-action-btn delete" title="Delete">🗑️</button>
            </div>
        `;

        this.setupLayerEventListeners(layerElement, layer);
        this.layerList.appendChild(layerElement);
    }

    getLayerIcon(type) {
        const icons = {
            heading: '📝',
            text: '📄',
            button: '🔘',
            image: '🖼️',
            form: '📋',
            divider: '➖',
            container: '📦',
            link: '🔗',
            spacer: '⬜',
            section: '📦'
        };
        return icons[type] || '📄';
    }

    setupLayerEventListeners(layerElement, layer) {
        // Layer selection
        layerElement.addEventListener('click', (e) => {
            if (!e.target.closest('.layer-actions')) {
                this.selectLayer(layer);
            }
        });

        // Drag and drop
        layerElement.addEventListener('dragstart', (e) => this.handleDragStart(e, layer));
        layerElement.addEventListener('dragend', (e) => this.handleDragEnd(e));

        // Layer name editing
        const nameElement = layerElement.querySelector('.layer-name');
        nameElement.addEventListener('dblclick', () => this.startEditingName(layerElement, layer));
        nameElement.addEventListener('blur', () => this.finishEditingName(layerElement, layer));
        nameElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameElement.blur();
            }
        });

        // Action buttons
        const visibilityBtn = layerElement.querySelector('.visibility');
        const lockBtn = layerElement.querySelector('.lock');
        const deleteBtn = layerElement.querySelector('.delete');

        visibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleVisibility(layer);
        });

        lockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLock(layer);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteLayer(layer);
        });
    }

    selectLayer(layer) {
        // Remove previous selection
        document.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to current layer
        const layerElement = document.querySelector(`[data-layer-id="${layer.id}"]`);
        if (layerElement) {
            layerElement.classList.add('selected');
        }

        // Select the corresponding canvas element
        this.builder.selectElement(layer.element);
    }

    startEditingName(layerElement, layer) {
        const nameElement = layerElement.querySelector('.layer-name');
        nameElement.contentEditable = true;
        nameElement.classList.add('editing');
        nameElement.focus();

        // Select all text
        const range = document.createRange();
        range.selectNodeContents(nameElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    finishEditingName(layerElement, layer) {
        const nameElement = layerElement.querySelector('.layer-name');
        const newName = nameElement.textContent.trim();

        if (newName && newName !== layer.name) {
            layer.name = newName;
            this.builder.showNotification(`Layer renamed to "${newName}"`, 'success');
        }

        nameElement.contentEditable = false;
        nameElement.classList.remove('editing');
    }

    toggleVisibility(layer) {
        layer.visible = !layer.visible;
        const layerElement = document.querySelector(`[data-layer-id="${layer.id}"]`);
        const visibilityBtn = layerElement.querySelector('.visibility');

        if (layer.visible) {
            layer.element.style.display = '';
            layer.element.style.opacity = '';
            layerElement.classList.remove('hidden');
            visibilityBtn.classList.remove('hidden');
            visibilityBtn.innerHTML = '👁️';
            visibilityBtn.title = 'Hide';
        } else {
            layer.element.style.display = 'none';
            layerElement.classList.add('hidden');
            visibilityBtn.classList.add('hidden');
            visibilityBtn.innerHTML = '🚫';
            visibilityBtn.title = 'Show';
        }
    }

    toggleLock(layer) {
        layer.locked = !layer.locked;
        const layerElement = document.querySelector(`[data-layer-id="${layer.id}"]`);
        const lockBtn = layerElement.querySelector('.lock');

        if (layer.locked) {
            layer.element.style.pointerEvents = 'none';
            layer.element.classList.add('locked');
            layerElement.classList.add('locked');
            lockBtn.classList.add('locked');
            lockBtn.innerHTML = '🔒';
            lockBtn.title = 'Unlock';
        } else {
            layer.element.style.pointerEvents = '';
            layer.element.classList.remove('locked');
            layerElement.classList.remove('locked');
            lockBtn.classList.remove('locked');
            lockBtn.innerHTML = '🔓';
            lockBtn.title = 'Lock';
        }
    }

    deleteLayer(layer) {
        if (confirm(`Are you sure you want to delete "${layer.name}"?`)) {
            // Remove from layers array
            this.layers = this.layers.filter(l => l.id !== layer.id);

            // Remove from DOM
            const layerElement = document.querySelector(`[data-layer-id="${layer.id}"]`);
            if (layerElement) {
                layerElement.remove();
            }

            // Remove canvas element
            this.builder.deleteElement(layer.elementId);

            this.updateLayerCount();
            this.builder.showNotification(`Layer "${layer.name}" deleted`, 'success');
        }
    }

    handleDragStart(e, layer) {
        this.draggedLayer = layer;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', layer.id);

        const layerElement = e.target.closest('.layer-item');
        layerElement.classList.add('dragging');
    }

    handleDragEnd(e) {
        const layerElement = e.target.closest('.layer-item');
        layerElement.classList.remove('dragging');
        this.draggedLayer = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const layerElement = e.target.closest('.layer-item');
        if (layerElement && this.draggedLayer) {
            const rect = layerElement.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            if (e.clientY < midY) {
                layerElement.style.borderTop = '2px solid var(--primary-red)';
                layerElement.style.borderBottom = '';
            } else {
                layerElement.style.borderTop = '';
                layerElement.style.borderBottom = '2px solid var(--primary-red)';
            }
        }
    }

    handleDrop(e) {
        e.preventDefault();

        const targetLayerElement = e.target.closest('.layer-item');
        if (!targetLayerElement || !this.draggedLayer) return;

        const targetLayerId = targetLayerElement.dataset.layerId;
        const targetLayer = this.layers.find(l => l.id === targetLayerId);

        if (targetLayer && this.draggedLayer.id !== targetLayer.id) {
            this.reorderLayers(this.draggedLayer, targetLayer, e);
        }

        // Clear visual indicators
        document.querySelectorAll('.layer-item').forEach(item => {
            item.style.borderTop = '';
            item.style.borderBottom = '';
        });
    }

    handleDragLeave(e) {
        const layerElement = e.target.closest('.layer-item');
        if (layerElement) {
            layerElement.style.borderTop = '';
            layerElement.style.borderBottom = '';
        }
    }

    reorderLayers(draggedLayer, targetLayer, e) {
        const rect = e.target.closest('.layer-item').getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const insertAfter = e.clientY > midY;

        // Remove dragged layer from array
        this.layers = this.layers.filter(l => l.id !== draggedLayer.id);

        // Find target index
        const targetIndex = this.layers.findIndex(l => l.id === targetLayer.id);

        // Insert at new position
        if (insertAfter) {
            this.layers.splice(targetIndex + 1, 0, draggedLayer);
        } else {
            this.layers.splice(targetIndex, 0, draggedLayer);
        }

        // Update z-index values
        this.updateZIndexes();

        // Re-render layer list
        this.renderLayerList();

        this.builder.showNotification(`Layer "${draggedLayer.name}" reordered`, 'success');
    }

    updateZIndexes() {
        this.layers.forEach((layer, index) => {
            const zIndex = this.layers.length - index;
            layer.element.style.zIndex = zIndex;
        });
    }

    renderLayerList() {
        this.layerList.innerHTML = '';

        if (this.layers.length === 0) {
            this.layerList.innerHTML = `
                <div class="layer-empty-state">
                    <div class="empty-icon">📄</div>
                    <p>No layers yet</p>
                    <span>Add elements to see them here</span>
                </div>
            `;
        } else {
            this.layers.forEach(layer => {
                this.renderLayer(layer);
            });
        }
    }

    updateLayerCount() {
        this.layerCount.textContent = this.layers.length;
    }

    expandAllLayers() {
        this.layers.forEach(layer => {
            if (!layer.visible) {
                this.toggleVisibility(layer);
            }
        });
        this.builder.showNotification('All layers expanded', 'success');
    }

    collapseAllLayers() {
        this.layers.forEach(layer => {
            if (layer.visible) {
                this.toggleVisibility(layer);
            }
        });
        this.builder.showNotification('All layers collapsed', 'success');
    }

    selectAllLayers() {
        this.layers.forEach(layer => {
            const layerElement = document.querySelector(`[data-layer-id="${layer.id}"]`);
            if (layerElement) {
                layerElement.classList.add('selected');
            }
        });
        this.builder.showNotification('All layers selected', 'success');
    }

    removeLayer(layerId) {
        this.layers = this.layers.filter(l => l.id !== layerId);
        this.updateLayerCount();
        this.renderLayerList();
    }

    getLayerByElementId(elementId) {
        return this.layers.find(l => l.elementId === elementId);
    }
}








// Initialize the website builder
const builder = new WebsiteBuilder(); 