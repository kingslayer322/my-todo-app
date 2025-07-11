import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [sortBy, setSortBy] = useState('created'); // created, priority, dueDate, category
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showStats, setShowStats] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Task templates
  const taskTemplates = [
    { name: 'Daily Routine', tasks: [
      { text: 'Morning exercise', category: 'health', priority: 'high' },
      { text: 'Check emails', category: 'work', priority: 'medium' },
      { text: 'Plan tomorrow', category: 'personal', priority: 'medium' }
    ]},
    { name: 'Work Tasks', tasks: [
      { text: 'Team meeting', category: 'work', priority: 'high' },
      { text: 'Review project', category: 'work', priority: 'medium' },
      { text: 'Update documentation', category: 'work', priority: 'low' }
    ]},
    { name: 'Shopping List', tasks: [
      { text: 'Groceries', category: 'shopping', priority: 'medium' },
      { text: 'Household items', category: 'shopping', priority: 'low' }
    ]}
  ];

  // Load tasks and theme from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('todoTasks');
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    }
  }, []);

  // Save tasks and theme to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            document.querySelector('.search-input')?.focus();
            break;
          case 'n':
            e.preventDefault();
            document.querySelector('.task-input')?.focus();
            break;
          case 'd':
            e.preventDefault();
            setDarkMode(!darkMode);
            break;
          case 'a':
            e.preventDefault();
            if (selectedTasks.size === filteredAndSortedTasks.length) {
              setSelectedTasks(new Set());
            } else {
              setSelectedTasks(new Set(filteredAndSortedTasks.map(task => task.id)));
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [darkMode, selectedTasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== '') {
      const newTask = {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false,
        category: selectedCategory,
        priority: selectedPriority,
        createdAt: new Date().toISOString(),
        dueDate: selectedDate || null,
        completedAt: null
      };
      setTasks([...tasks, newTask]);
      setInputValue('');
      setSelectedDate('');
    }
  };

  const addTemplateTasks = (template) => {
    const newTasks = template.tasks.map((task, index) => ({
      id: Date.now() + index,
      text: task.text,
      completed: false,
      category: task.category,
      priority: task.priority,
      createdAt: new Date().toISOString(),
      dueDate: null,
      completedAt: null
    }));
    setTasks([...tasks, ...newTasks]);
    setShowTemplates(false);
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  };

  const toggleComplete = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { 
        ...task, 
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
      } : task
    ));
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const bulkComplete = () => {
    setTasks(tasks.map(task =>
      selectedTasks.has(task.id) ? { 
        ...task, 
        completed: true,
        completedAt: new Date().toISOString()
      } : task
    ));
    setSelectedTasks(new Set());
  };

  const bulkDelete = () => {
    setTasks(tasks.filter(task => !selectedTasks.has(task.id)));
    setSelectedTasks(new Set());
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditValue(task.text);
  };

  const saveEdit = (taskId) => {
    if (editValue.trim() !== '') {
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, text: editValue.trim() } : task
      ));
      setEditingId(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTasks = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTasks = JSON.parse(e.target.result);
          setTasks(importedTasks);
        } catch (error) {
          alert('Invalid file format. Please select a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'work': return '💼';
      case 'personal': return '👤';
      case 'shopping': return '🛒';
      case 'health': return '🏥';
      default: return '📝';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString();
  };

  const sortTasks = (taskList) => {
    return taskList.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'created':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  };

  const filteredAndSortedTasks = sortTasks(
    tasks.filter(task => {
      // Search filter
      const matchesSearch = task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesFilter = filter === 'all' ? true :
                          filter === 'active' ? !task.completed :
                          filter === 'completed' ? task.completed : true;

      // Show/hide completed filter
      const matchesCompleted = showCompleted || !task.completed;

      return matchesSearch && matchesFilter && matchesCompleted;
    })
  );

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;
  const overdueCount = tasks.filter(task => isOverdue(task.dueDate) && !task.completed).length;
  const highPriorityCount = tasks.filter(task => task.priority === 'high' && !task.completed).length;

  // Statistics
  const getStats = () => {
    const today = new Date();
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const completedToday = tasks.filter(task => 
      task.completed && task.completedAt && 
      new Date(task.completedAt).toDateString() === today.toDateString()
    ).length;

    const completedThisWeek = tasks.filter(task => 
      task.completed && task.completedAt && 
      new Date(task.completedAt) >= thisWeek
    ).length;

    const completedThisMonth = tasks.filter(task => 
      task.completed && task.completedAt && 
      new Date(task.completedAt) >= thisMonth
    ).length;

    const categoryStats = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {});

    return {
      completedToday,
      completedThisWeek,
      completedThisMonth,
      categoryStats,
      completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    };
  };

  const stats = getStats();

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      <header className="App-header">
        <div className="header-top">
          <h1>My Todo List</h1>
          <div className="header-actions">
            <button 
              onClick={() => setShowStats(!showStats)}
              className="stats-button"
              title="View Statistics"
            >
              📊
            </button>
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="templates-button"
              title="Task Templates"
            >
              📋
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="theme-toggle"
              title="Toggle dark mode (Ctrl+D)"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        {totalCount > 0 && (
          <div className="progress-info">
            <span>{completedCount} of {totalCount} tasks completed ({stats.completionRate}%)</span>
            {overdueCount > 0 && (
              <span className="overdue-warning">⚠️ {overdueCount} overdue</span>
            )}
            {highPriorityCount > 0 && (
              <span className="priority-warning">🔴 {highPriorityCount} high priority</span>
            )}
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
        )}
      </header>
      
      <main className="App-main">
        {showStats && (
          <div className="stats-panel">
            <h3>📊 Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{stats.completedToday}</span>
                <span className="stat-label">Completed Today</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.completedThisWeek}</span>
                <span className="stat-label">This Week</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.completedThisMonth}</span>
                <span className="stat-label">This Month</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.completionRate}%</span>
                <span className="stat-label">Completion Rate</span>
              </div>
            </div>
            <div className="category-stats">
              <h4>Tasks by Category:</h4>
              {Object.entries(stats.categoryStats).map(([category, count]) => (
                <div key={category} className="category-stat">
                  <span>{getCategoryIcon(category)} {category}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowStats(false)} className="close-button">Close</button>
          </div>
        )}

        {showTemplates && (
          <div className="templates-panel">
            <h3>📋 Task Templates</h3>
            <div className="templates-grid">
              {taskTemplates.map((template, index) => (
                <div key={index} className="template-card">
                  <h4>{template.name}</h4>
                  <ul>
                    {template.tasks.map((task, taskIndex) => (
                      <li key={taskIndex}>
                        {getCategoryIcon(task.category)} {task.text} {getPriorityIcon(task.priority)}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => addTemplateTasks(template)}
                    className="use-template-button"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTemplates(false)} className="close-button">Close</button>
          </div>
        )}

        <div className="search-container">
          <input
            type="text"
            placeholder="Search tasks... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <form onSubmit={addTask} className="task-form">
          <div className="input-group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter a new task... (Ctrl+N)"
              className="task-input"
            />
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="personal">👤 Personal</option>
              <option value="work">💼 Work</option>
              <option value="shopping">🛒 Shopping</option>
              <option value="health">🏥 Health</option>
            </select>
            <select 
              value={selectedPriority} 
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="priority-select"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>
          <button type="submit" className="add-button">
            Add Task
          </button>
        </form>

        <div className="controls-row">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({totalCount})
            </button>
            <button 
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({totalCount - completedCount})
            </button>
            <button 
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({completedCount})
            </button>
          </div>

          <div className="sort-controls">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="created">Sort by Created</option>
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="category">Sort by Category</option>
            </select>
            <label className="show-completed">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
              Show completed
            </label>
          </div>
        </div>

        {selectedTasks.size > 0 && (
          <div className="bulk-actions">
            <span>{selectedTasks.size} tasks selected</span>
            <button onClick={bulkComplete} className="bulk-complete-btn">
              Mark Complete
            </button>
            <button onClick={bulkDelete} className="bulk-delete-btn">
              Delete Selected
            </button>
            <button onClick={() => setSelectedTasks(new Set())} className="clear-selection-btn">
              Clear Selection
            </button>
          </div>
        )}

        <div className="export-import">
          <button onClick={exportTasks} className="export-btn">
            📤 Export Tasks
          </button>
          <label className="import-btn">
            📥 Import Tasks
            <input
              type="file"
              accept=".json"
              onChange={importTasks}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        
        <div className="task-list">
          {filteredAndSortedTasks.length === 0 ? (
            <p className="no-tasks">
              {searchQuery ? 'No tasks match your search.' :
               filter === 'all' ? 'No tasks yet. Add one above!' : 
               filter === 'active' ? 'No active tasks!' : 'No completed tasks!'}
            </p>
          ) : (
            filteredAndSortedTasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''} ${isOverdue(task.dueDate) ? 'overdue' : ''} ${selectedTasks.has(task.id) ? 'selected' : ''}`}>
                <div className="task-content">
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onChange={() => toggleTaskSelection(task.id)}
                    className="selection-checkbox"
                  />
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task.id)}
                    className="task-checkbox"
                  />
                  <div className="task-info">
                    <span className="task-category">{getCategoryIcon(task.category)}</span>
                    <span className="task-priority-icon">{getPriorityIcon(task.priority)}</span>
                    {editingId === task.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit(task.id)}
                        onBlur={() => saveEdit(task.id)}
                        className="edit-input"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="task-text"
                        onDoubleClick={() => startEditing(task)}
                      >
                        {task.text}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                        📅 {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  {editingId !== task.id && (
                    <button
                      onClick={() => startEditing(task)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
