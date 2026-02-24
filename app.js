// Job Notification Tracker - Routing

const routes = {
  '/': {
    title: 'Job Notification Tracker',
    render: renderLanding
  },
  '/dashboard': {
    title: 'Dashboard',
    render: renderDashboard
  },
  '/saved': {
    title: 'Saved',
    render: renderSaved
  },
  '/digest': {
    title: 'Digest',
    render: renderDigest
  },
  '/settings': {
    title: 'Settings',
    render: renderSettings
  },
  '/proof': {
    title: 'Proof',
    render: renderProof
  },
  '/jt/proof': {
    title: 'Final Proof',
    render: renderFinalProof
  },
  '/jt/07-test': {
    title: 'Test Checklist',
    render: renderTestChecklist
  },
  '/jt/08-ship': {
    title: 'Ship',
    render: renderShip
  }
};

let currentFilters = {
  keyword: '',
  location: '',
  mode: '',
  experience: '',
  source: '',
  status: '',
  sort: 'latest'
};

let showOnlyMatches = false;
let viewingJob = null;
let toastTimeout = null;

function getPreferences() {
  const prefs = localStorage.getItem('jobTrackerPreferences');
  return prefs ? JSON.parse(prefs) : null;
}

function setPreferences(prefs) {
  localStorage.setItem('jobTrackerPreferences', JSON.stringify(prefs));
}

function getJobStatus(jobId) {
  const statuses = localStorage.getItem('jobTrackerStatus');
  const statusMap = statuses ? JSON.parse(statuses) : {};
  return statusMap[jobId] || 'Not Applied';
}

function setJobStatus(jobId, status) {
  const statuses = localStorage.getItem('jobTrackerStatus');
  const statusMap = statuses ? JSON.parse(statuses) : {};
  statusMap[jobId] = status;
  localStorage.setItem('jobTrackerStatus', JSON.stringify(statusMap));
  
  // Track status change history
  const history = localStorage.getItem('jobTrackerStatusHistory');
  const historyList = history ? JSON.parse(history) : [];
  historyList.unshift({
    jobId,
    status,
    date: new Date().toISOString()
  });
  localStorage.setItem('jobTrackerStatusHistory', JSON.stringify(historyList.slice(0, 20)));
  
  showToast(`Status updated: ${status}`);
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('toast--show'), 10);
  
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

function calculateMatchScore(job) {
  const prefs = getPreferences();
  if (!prefs) return 0;
  
  let score = 0;
  
  const roleKeywords = prefs.roleKeywords ? prefs.roleKeywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k) : [];
  const userSkills = prefs.skills ? prefs.skills.toLowerCase().split(',').map(s => s.trim()).filter(s => s) : [];
  
  // +25 if any roleKeyword appears in job.title
  if (roleKeywords.some(kw => job.title.toLowerCase().includes(kw))) {
    score += 25;
  }
  
  // +15 if any roleKeyword appears in job.description
  if (roleKeywords.some(kw => job.description.toLowerCase().includes(kw))) {
    score += 15;
  }
  
  // +15 if job.location matches preferredLocations
  if (prefs.preferredLocations && prefs.preferredLocations.includes(job.location)) {
    score += 15;
  }
  
  // +10 if job.mode matches preferredMode
  if (prefs.preferredMode && prefs.preferredMode.includes(job.mode)) {
    score += 10;
  }
  
  // +10 if job.experience matches experienceLevel
  if (prefs.experienceLevel && job.experience === prefs.experienceLevel) {
    score += 10;
  }
  
  // +15 if overlap between job.skills and user.skills
  if (userSkills.length > 0) {
    const jobSkillsLower = job.skills.map(s => s.toLowerCase());
    if (userSkills.some(us => jobSkillsLower.some(js => js.includes(us) || us.includes(js)))) {
      score += 15;
    }
  }
  
  // +5 if postedDaysAgo <= 2
  if (job.postedDaysAgo <= 2) {
    score += 5;
  }
  
  // +5 if source is LinkedIn
  if (job.source === 'LinkedIn') {
    score += 5;
  }
  
  return Math.min(score, 100);
}

function renderLanding() {
  return `
    <div class="landing">
      <div class="landing__content">
        <h1 class="landing__title">Stop Missing The Right Jobs.</h1>
        <p class="landing__subtitle">Precision-matched job discovery delivered daily at 9AM.</p>
        <a href="#/settings" class="btn btn--primary landing__cta">Start Tracking</a>
      </div>
    </div>
  `;
}

function getFilteredJobs() {
  let filtered = jobsData.map(job => ({
    ...job,
    matchScore: calculateMatchScore(job)
  }));
  
  // Apply match threshold filter
  const prefs = getPreferences();
  if (showOnlyMatches && prefs) {
    const threshold = prefs.minMatchScore || 40;
    filtered = filtered.filter(j => j.matchScore >= threshold);
  }
  
  // Apply keyword filter
  if (currentFilters.keyword) {
    const kw = currentFilters.keyword.toLowerCase();
    filtered = filtered.filter(j => 
      j.title.toLowerCase().includes(kw) || 
      j.company.toLowerCase().includes(kw)
    );
  }
  
  // Apply location filter
  if (currentFilters.location) {
    filtered = filtered.filter(j => j.location === currentFilters.location);
  }
  
  // Apply mode filter
  if (currentFilters.mode) {
    filtered = filtered.filter(j => j.mode === currentFilters.mode);
  }
  
  // Apply experience filter
  if (currentFilters.experience) {
    filtered = filtered.filter(j => j.experience === currentFilters.experience);
  }
  
  // Apply source filter
  if (currentFilters.source) {
    filtered = filtered.filter(j => j.source === currentFilters.source);
  }
  
  // Apply status filter
  if (currentFilters.status) {
    filtered = filtered.filter(j => getJobStatus(j.id) === currentFilters.status);
  }
  
  // Apply sorting
  if (currentFilters.sort === 'latest') {
    filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  } else if (currentFilters.sort === 'match') {
    filtered.sort((a, b) => b.matchScore - a.matchScore);
  } else if (currentFilters.sort === 'salary') {
    filtered.sort((a, b) => {
      const extractNum = (str) => {
        const match = str.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };
      return extractNum(b.salaryRange) - extractNum(a.salaryRange);
    });
  }
  
  return filtered;
}

function renderJobCard(job) {
  const isSaved = getSavedJobs().includes(job.id);
  const daysText = job.postedDaysAgo === 0 ? 'Today' : job.postedDaysAgo === 1 ? '1 day ago' : `${job.postedDaysAgo} days ago`;
  const prefs = getPreferences();
  const status = getJobStatus(job.id);
  
  let matchBadge = '';
  if (prefs) {
    const score = job.matchScore;
    let badgeClass = 'match-badge--grey';
    if (score >= 80) badgeClass = 'match-badge--green';
    else if (score >= 60) badgeClass = 'match-badge--amber';
    else if (score >= 40) badgeClass = 'match-badge--neutral';
    
    matchBadge = `<span class="match-badge ${badgeClass}">${score}% match</span>`;
  }
  
  let statusBadgeClass = 'status-badge--neutral';
  if (status === 'Applied') statusBadgeClass = 'status-badge--blue';
  else if (status === 'Rejected') statusBadgeClass = 'status-badge--red';
  else if (status === 'Selected') statusBadgeClass = 'status-badge--green';
  
  return `
    <div class="job-card">
      <div class="job-card__header">
        <div>
          <h3 class="job-card__title">${job.title}</h3>
          <div class="job-card__company">${job.company}</div>
        </div>
        <div class="job-card__badges">
          ${matchBadge}
          <span class="job-badge job-badge--${job.source.toLowerCase()}">${job.source}</span>
        </div>
      </div>
      <div class="job-card__meta">
        <span>${job.location}</span>
        <span>•</span>
        <span>${job.mode}</span>
        <span>•</span>
        <span>${job.experience}</span>
      </div>
      <div class="job-card__salary">${job.salaryRange}</div>
      <div class="job-card__posted">${daysText}</div>
      
      <div class="status-selector">
        <label class="status-selector__label">Status:</label>
        <select class="status-selector__select ${statusBadgeClass}" onchange="setJobStatus(${job.id}, this.value); router();">
          <option value="Not Applied" ${status === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
          <option value="Applied" ${status === 'Applied' ? 'selected' : ''}>Applied</option>
          <option value="Rejected" ${status === 'Rejected' ? 'selected' : ''}>Rejected</option>
          <option value="Selected" ${status === 'Selected' ? 'selected' : ''}>Selected</option>
        </select>
      </div>
      
      <div class="job-card__actions">
        <button class="btn btn--secondary btn--sm" onclick="viewJob(${job.id})">View</button>
        <button class="btn btn--secondary btn--sm" onclick="toggleSaveJob(${job.id})">${isSaved ? 'Unsave' : 'Save'}</button>
        <button class="btn btn--primary btn--sm" onclick="applyJob('${job.applyUrl}')">Apply</button>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const prefs = getPreferences();
  const jobs = getFilteredJobs();
  
  let prefsBanner = '';
  if (!prefs) {
    prefsBanner = `
      <div class="prefs-banner">
        <span>Set your preferences to activate intelligent matching.</span>
        <a href="#/settings" class="btn btn--secondary btn--sm">Go to Settings</a>
      </div>
    `;
  }
  
  let matchToggle = '';
  if (prefs) {
    matchToggle = `
      <label class="match-toggle">
        <input type="checkbox" ${showOnlyMatches ? 'checked' : ''} onchange="toggleMatchFilter(this.checked)">
        <span>Show only jobs above my threshold (${prefs.minMatchScore || 40}%)</span>
      </label>
    `;
  }
  
  let jobsContent = '';
  if (jobs.length === 0) {
    jobsContent = `
      <div class="empty-state">
        <div class="empty-state__title">No roles match your criteria</div>
        <div class="empty-state__description">Adjust filters or lower threshold in settings.</div>
      </div>
    `;
  } else {
    jobsContent = `
      <div class="jobs-count">${jobs.length} jobs found</div>
      <div class="jobs-grid">
        ${jobs.map(job => renderJobCard(job)).join('')}
      </div>
    `;
  }
  
  return `
    <div class="page">
      <div class="page__header">
        <h1>Dashboard</h1>
        <p class="page__subtitle">Browse ${jobsData.length} tech jobs from India</p>
      </div>
      
      ${prefsBanner}
      
      <div class="filter-bar filter-bar--extended">
        <input type="text" class="input filter-bar__input" placeholder="Search by title or company" 
          value="${currentFilters.keyword}" onchange="updateFilter('keyword', this.value)">
        
        <select class="input filter-bar__select" onchange="updateFilter('location', this.value)">
          <option value="">All Locations</option>
          <option value="Bangalore" ${currentFilters.location === 'Bangalore' ? 'selected' : ''}>Bangalore</option>
          <option value="Hyderabad" ${currentFilters.location === 'Hyderabad' ? 'selected' : ''}>Hyderabad</option>
          <option value="Pune" ${currentFilters.location === 'Pune' ? 'selected' : ''}>Pune</option>
          <option value="Chennai" ${currentFilters.location === 'Chennai' ? 'selected' : ''}>Chennai</option>
          <option value="Mumbai" ${currentFilters.location === 'Mumbai' ? 'selected' : ''}>Mumbai</option>
          <option value="Noida" ${currentFilters.location === 'Noida' ? 'selected' : ''}>Noida</option>
          <option value="Gurgaon" ${currentFilters.location === 'Gurgaon' ? 'selected' : ''}>Gurgaon</option>
          <option value="Mysore" ${currentFilters.location === 'Mysore' ? 'selected' : ''}>Mysore</option>
        </select>
        
        <select class="input filter-bar__select" onchange="updateFilter('mode', this.value)">
          <option value="">All Modes</option>
          <option value="Remote" ${currentFilters.mode === 'Remote' ? 'selected' : ''}>Remote</option>
          <option value="Hybrid" ${currentFilters.mode === 'Hybrid' ? 'selected' : ''}>Hybrid</option>
          <option value="Onsite" ${currentFilters.mode === 'Onsite' ? 'selected' : ''}>Onsite</option>
        </select>
        
        <select class="input filter-bar__select" onchange="updateFilter('experience', this.value)">
          <option value="">All Experience</option>
          <option value="Fresher" ${currentFilters.experience === 'Fresher' ? 'selected' : ''}>Fresher</option>
          <option value="0-1" ${currentFilters.experience === '0-1' ? 'selected' : ''}>0-1 Years</option>
          <option value="1-3" ${currentFilters.experience === '1-3' ? 'selected' : ''}>1-3 Years</option>
          <option value="3-5" ${currentFilters.experience === '3-5' ? 'selected' : ''}>3-5 Years</option>
        </select>
        
        <select class="input filter-bar__select" onchange="updateFilter('source', this.value)">
          <option value="">All Sources</option>
          <option value="LinkedIn" ${currentFilters.source === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
          <option value="Naukri" ${currentFilters.source === 'Naukri' ? 'selected' : ''}>Naukri</option>
          <option value="Indeed" ${currentFilters.source === 'Indeed' ? 'selected' : ''}>Indeed</option>
        </select>
        
        <select class="input filter-bar__select" onchange="updateFilter('sort', this.value)">
          <option value="latest" ${currentFilters.sort === 'latest' ? 'selected' : ''}>Latest</option>
          <option value="match" ${currentFilters.sort === 'match' ? 'selected' : ''}>Match Score</option>
          <option value="salary" ${currentFilters.sort === 'salary' ? 'selected' : ''}>Salary</option>
        </select>
        
        <select class="input filter-bar__select" onchange="updateFilter('status', this.value)">
          <option value="">All Status</option>
          <option value="Not Applied" ${currentFilters.status === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
          <option value="Applied" ${currentFilters.status === 'Applied' ? 'selected' : ''}>Applied</option>
          <option value="Rejected" ${currentFilters.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
          <option value="Selected" ${currentFilters.status === 'Selected' ? 'selected' : ''}>Selected</option>
        </select>
      </div>
      
      ${matchToggle}
      
      ${jobsContent}
    </div>
    ${viewingJob ? renderJobModal(viewingJob) : ''}
  `;
}

function renderJobModal(jobId) {
  const job = jobsData.find(j => j.id === jobId);
  if (!job) return '';
  
  return `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal__header">
          <h2>${job.title}</h2>
          <button class="modal__close" onclick="closeModal()">×</button>
        </div>
        <div class="modal__body">
          <div class="modal__company">${job.company} • ${job.location} • ${job.mode}</div>
          <div class="modal__salary">${job.salaryRange}</div>
          <div class="modal__section">
            <h3>Description</h3>
            <p>${job.description}</p>
          </div>
          <div class="modal__section">
            <h3>Skills Required</h3>
            <div class="skills-list">
              ${job.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
            </div>
          </div>
          <div class="modal__section">
            <div class="modal__meta">Experience: ${job.experience} • Posted ${job.postedDaysAgo === 0 ? 'today' : job.postedDaysAgo + ' days ago'}</div>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" onclick="closeModal()">Close</button>
          <button class="btn btn--primary" onclick="applyJob('${job.applyUrl}')">Apply Now</button>
        </div>
      </div>
    </div>
  `;
}

function renderSettings() {
  const prefs = getPreferences() || {};
  
  return `
    <div class="page">
      <div class="page__header">
        <h1>Settings</h1>
        <p class="page__subtitle">Configure your job preferences</p>
      </div>
      <form class="settings" onsubmit="savePreferences(event)">
        <div class="settings__section">
          <label class="settings__label">Role Keywords (comma-separated)</label>
          <input type="text" class="input" id="roleKeywords" 
            placeholder="e.g. Developer, Engineer, Intern" 
            value="${prefs.roleKeywords || ''}">
        </div>
        
        <div class="settings__section">
          <label class="settings__label">Preferred Locations</label>
          <select class="input" id="preferredLocations" multiple size="5">
            <option value="Bangalore" ${prefs.preferredLocations?.includes('Bangalore') ? 'selected' : ''}>Bangalore</option>
            <option value="Hyderabad" ${prefs.preferredLocations?.includes('Hyderabad') ? 'selected' : ''}>Hyderabad</option>
            <option value="Pune" ${prefs.preferredLocations?.includes('Pune') ? 'selected' : ''}>Pune</option>
            <option value="Chennai" ${prefs.preferredLocations?.includes('Chennai') ? 'selected' : ''}>Chennai</option>
            <option value="Mumbai" ${prefs.preferredLocations?.includes('Mumbai') ? 'selected' : ''}>Mumbai</option>
            <option value="Noida" ${prefs.preferredLocations?.includes('Noida') ? 'selected' : ''}>Noida</option>
            <option value="Gurgaon" ${prefs.preferredLocations?.includes('Gurgaon') ? 'selected' : ''}>Gurgaon</option>
            <option value="Mysore" ${prefs.preferredLocations?.includes('Mysore') ? 'selected' : ''}>Mysore</option>
          </select>
          <small class="settings__hint">Hold Ctrl/Cmd to select multiple</small>
        </div>
        
        <div class="settings__section">
          <label class="settings__label">Preferred Mode</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" value="Remote" ${prefs.preferredMode?.includes('Remote') ? 'checked' : ''}>
              <span>Remote</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" value="Hybrid" ${prefs.preferredMode?.includes('Hybrid') ? 'checked' : ''}>
              <span>Hybrid</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" value="Onsite" ${prefs.preferredMode?.includes('Onsite') ? 'checked' : ''}>
              <span>Onsite</span>
            </label>
          </div>
        </div>
        
        <div class="settings__section">
          <label class="settings__label">Experience Level</label>
          <select class="input" id="experienceLevel">
            <option value="">Any</option>
            <option value="Fresher" ${prefs.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
            <option value="0-1" ${prefs.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Years</option>
            <option value="1-3" ${prefs.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
            <option value="3-5" ${prefs.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
          </select>
        </div>
        
        <div class="settings__section">
          <label class="settings__label">Skills (comma-separated)</label>
          <input type="text" class="input" id="skills" 
            placeholder="e.g. React, Python, Java" 
            value="${prefs.skills || ''}">
        </div>
        
        <div class="settings__section">
          <label class="settings__label">Minimum Match Score: <span id="scoreValue">${prefs.minMatchScore || 40}</span>%</label>
          <input type="range" class="slider" id="minMatchScore" 
            min="0" max="100" value="${prefs.minMatchScore || 40}" 
            oninput="document.getElementById('scoreValue').textContent = this.value">
        </div>
        
        <button type="submit" class="btn btn--primary">Save Preferences</button>
      </form>
    </div>
  `;
}

function renderSaved() {
  const savedIds = getSavedJobs();
  const savedJobs = jobsData.filter(j => savedIds.includes(j.id));
  
  if (savedJobs.length === 0) {
    return `
      <div class="page">
        <div class="page__header">
          <h1>Saved</h1>
        </div>
        <div class="empty-state">
          <div class="empty-state__title">No saved jobs yet</div>
          <div class="empty-state__description">Jobs you save will appear here for easy access.</div>
          <a href="#/dashboard" class="btn btn--primary">Browse Jobs</a>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="page">
      <div class="page__header">
        <h1>Saved</h1>
        <p class="page__subtitle">${savedJobs.length} saved jobs</p>
      </div>
      <div class="jobs-grid">
        ${savedJobs.map(job => renderJobCard(job)).join('')}
      </div>
    </div>
    ${viewingJob ? renderJobModal(viewingJob) : ''}
  `;
}

function renderDigest() {
  const prefs = getPreferences();
  
  if (!prefs) {
    return `
      <div class="page">
        <div class="page__header">
          <h1>Digest</h1>
        </div>
        <div class="empty-state">
          <div class="empty-state__title">Set preferences to generate a personalized digest</div>
          <div class="empty-state__description">Configure your job preferences in Settings first.</div>
          <a href="#/settings" class="btn btn--primary">Go to Settings</a>
        </div>
      </div>
    `;
  }
  
  const today = new Date().toISOString().split('T')[0];
  const digestKey = `jobTrackerDigest_${today}`;
  let digest = localStorage.getItem(digestKey);
  
  if (digest) {
    digest = JSON.parse(digest);
  }
  
  if (!digest) {
    return `
      <div class="page">
        <div class="page__header">
          <h1>Digest</h1>
          <p class="page__subtitle">Your personalized daily job digest</p>
        </div>
        <div class="digest-card">
          <div class="empty-state">
            <div class="empty-state__title">Generate Today's Digest</div>
            <div class="empty-state__description">Click below to generate your personalized 9AM digest.</div>
            <button class="btn btn--primary" onclick="generateDigest()">Generate Today's 9AM Digest (Simulated)</button>
            <small class="digest-note">Demo Mode: Daily 9AM trigger simulated manually.</small>
          </div>
        </div>
      </div>
    `;
  }
  
  if (digest.jobs.length === 0) {
    return `
      <div class="page">
        <div class="page__header">
          <h1>Digest</h1>
        </div>
        <div class="digest-card">
          <div class="empty-state">
            <div class="empty-state__title">No matching roles today</div>
            <div class="empty-state__description">Check again tomorrow or adjust your preferences.</div>
            <button class="btn btn--secondary" onclick="regenerateDigest()">Regenerate Digest</button>
          </div>
        </div>
      </div>
    `;
  }
  
  const dateStr = new Date(digest.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Get recent status updates
  const history = localStorage.getItem('jobTrackerStatusHistory');
  const statusUpdates = history ? JSON.parse(history).slice(0, 5) : [];
  
  return `
    <div class="page">
      <div class="page__header">
        <h1>Digest</h1>
        <p class="page__subtitle">Your personalized daily job digest</p>
      </div>
      
      <div class="digest-card">
        <div class="digest-header">
          <h2>Top 10 Jobs For You — 9AM Digest</h2>
          <p class="digest-date">${dateStr}</p>
        </div>
        
        <div class="digest-jobs">
          ${digest.jobs.map((job, idx) => `
            <div class="digest-job">
              <div class="digest-job__number">${idx + 1}</div>
              <div class="digest-job__content">
                <h3 class="digest-job__title">${job.title}</h3>
                <div class="digest-job__company">${job.company}</div>
                <div class="digest-job__meta">
                  ${job.location} • ${job.experience} • <span class="digest-job__match">${job.matchScore}% match</span>
                </div>
              </div>
              <button class="btn btn--primary btn--sm" onclick="applyJob('${job.applyUrl}')">Apply</button>
            </div>
          `).join('')}
        </div>
        
        <div class="digest-footer">
          <p>This digest was generated based on your preferences.</p>
          <small class="digest-note">Demo Mode: Daily 9AM trigger simulated manually.</small>
        </div>
        
        <div class="digest-actions">
          <button class="btn btn--secondary" onclick="copyDigestToClipboard()">Copy Digest to Clipboard</button>
          <button class="btn btn--secondary" onclick="createEmailDraft()">Create Email Draft</button>
          <button class="btn btn--secondary" onclick="regenerateDigest()">Regenerate</button>
        </div>
      </div>
      
      ${statusUpdates.length > 0 ? `
        <div class="digest-card" style="margin-top: var(--space-md);">
          <div class="digest-header">
            <h2>Recent Status Updates</h2>
          </div>
          <div class="status-updates">
            ${statusUpdates.map(update => {
              const job = jobsData.find(j => j.id === update.jobId);
              if (!job) return '';
              const updateDate = new Date(update.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              let statusClass = 'status-badge--neutral';
              if (update.status === 'Applied') statusClass = 'status-badge--blue';
              else if (update.status === 'Rejected') statusClass = 'status-badge--red';
              else if (update.status === 'Selected') statusClass = 'status-badge--green';
              return `
                <div class="status-update">
                  <div class="status-update__content">
                    <div class="status-update__title">${job.title}</div>
                    <div class="status-update__company">${job.company}</div>
                  </div>
                  <div class="status-update__meta">
                    <span class="status-badge ${statusClass}">${update.status}</span>
                    <span class="status-update__date">${updateDate}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderProof() {
  return `
    <div class="page">
      <div class="page__header">
        <h1>Proof</h1>
        <p class="page__subtitle">Artifact collection</p>
      </div>
      <div class="empty-state">
        <div class="empty-state__title">Proof artifacts</div>
        <div class="empty-state__description">Documentation and proof of work will be collected here.</div>
        <a href="#/jt/proof" class="btn btn--primary">Go to Final Proof</a>
      </div>
    </div>
  `;
}

function getProofData() {
  const proof = localStorage.getItem('jobTrackerProof');
  return proof ? JSON.parse(proof) : {};
}

function setProofData(data) {
  localStorage.setItem('jobTrackerProof', JSON.stringify(data));
}

function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

function isProjectShipped() {
  const proof = getProofData();
  const allTestsPassed = isAllTestsPassed();
  const allLinksProvided = proof.lovableLink && proof.githubLink && proof.deployedUrl;
  const allLinksValid = isValidUrl(proof.lovableLink) && isValidUrl(proof.githubLink) && isValidUrl(proof.deployedUrl);
  
  return allTestsPassed && allLinksProvided && allLinksValid;
}

function getProjectStatus() {
  const proof = getProofData();
  const hasAnyLink = proof.lovableLink || proof.githubLink || proof.deployedUrl;
  
  if (isProjectShipped()) return 'Shipped';
  if (hasAnyLink || isAllTestsPassed()) return 'In Progress';
  return 'Not Started';
}

function saveProofLinks(event) {
  event.preventDefault();
  
  const form = event.target;
  const lovableLink = form.querySelector('#lovableLink').value.trim();
  const githubLink = form.querySelector('#githubLink').value.trim();
  const deployedUrl = form.querySelector('#deployedUrl').value.trim();
  
  if (lovableLink && !isValidUrl(lovableLink)) {
    alert('Invalid Lovable Project URL. Must start with http:// or https://');
    return;
  }
  
  if (githubLink && !isValidUrl(githubLink)) {
    alert('Invalid GitHub Repository URL. Must start with http:// or https://');
    return;
  }
  
  if (deployedUrl && !isValidUrl(deployedUrl)) {
    alert('Invalid Deployed URL. Must start with http:// or https://');
    return;
  }
  
  setProofData({ lovableLink, githubLink, deployedUrl });
  router();
}

function copyFinalSubmission() {
  const proof = getProofData();
  
  if (!proof.lovableLink || !proof.githubLink || !proof.deployedUrl) {
    alert('Please provide all three links before copying submission.');
    return;
  }
  
  const text = `------------------------------------------
Job Notification Tracker — Final Submission

Lovable Project:
${proof.lovableLink}

GitHub Repository:
${proof.githubLink}

Live Deployment:
${proof.deployedUrl}

Core Features:
- Intelligent match scoring
- Daily digest simulation
- Status tracking
- Test checklist enforced
------------------------------------------`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Final submission copied to clipboard!');
  });
}

function renderFinalProof() {
  const proof = getProofData();
  const status = getProjectStatus();
  const shipped = isProjectShipped();
  
  let statusClass = 'status--not-started';
  if (status === 'In Progress') statusClass = 'status--in-progress';
  if (status === 'Shipped') statusClass = 'status--shipped';
  
  const steps = [
    { name: 'Job Data & Rendering', completed: true },
    { name: 'Preference Logic', completed: true },
    { name: 'Match Scoring Engine', completed: true },
    { name: 'Filter System', completed: true },
    { name: 'Status Tracking', completed: true },
    { name: 'Daily Digest', completed: true },
    { name: 'Test Checklist', completed: isAllTestsPassed() },
    { name: 'Final Proof', completed: shipped }
  ];
  
  const completedSteps = steps.filter(s => s.completed).length;
  
  return `
    <div class="page">
      <div class="page__header">
        <h1>Final Proof</h1>
        <p class="page__subtitle">Project 1 — Job Notification Tracker</p>
      </div>
      
      <div class="proof-status">
        <div class="proof-status__label">Project Status:</div>
        <div class="proof-status__badge ${statusClass}">${status}</div>
      </div>
      
      ${shipped ? `
        <div class="shipped-message">
          <div class="shipped-message__icon">✓</div>
          <div class="shipped-message__text">Project 1 Shipped Successfully.</div>
        </div>
      ` : ''}
      
      <div class="proof-section">
        <h2>A) Step Completion Summary</h2>
        <div class="step-summary">
          <div class="step-summary__progress">${completedSteps} / ${steps.length} Steps Completed</div>
          <div class="step-list">
            ${steps.map(step => `
              <div class="step-item ${step.completed ? 'step-item--completed' : ''}">
                <span class="step-item__checkbox">${step.completed ? '✓' : '□'}</span>
                <span class="step-item__name">${step.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <div class="proof-section">
        <h2>B) Artifact Collection</h2>
        <form class="proof-form" onsubmit="saveProofLinks(event)">
          <div class="proof-form__field">
            <label class="proof-form__label">Lovable Project Link *</label>
            <input 
              type="url" 
              class="input" 
              id="lovableLink" 
              placeholder="https://lovable.dev/projects/..." 
              value="${proof.lovableLink || ''}"
              required
            >
          </div>
          
          <div class="proof-form__field">
            <label class="proof-form__label">GitHub Repository Link *</label>
            <input 
              type="url" 
              class="input" 
              id="githubLink" 
              placeholder="https://github.com/username/repo" 
              value="${proof.githubLink || ''}"
              required
            >
          </div>
          
          <div class="proof-form__field">
            <label class="proof-form__label">Deployed URL (Vercel or equivalent) *</label>
            <input 
              type="url" 
              class="input" 
              id="deployedUrl" 
              placeholder="https://your-project.vercel.app" 
              value="${proof.deployedUrl || ''}"
              required
            >
          </div>
          
          <button type="submit" class="btn btn--primary">Save Links</button>
        </form>
      </div>
      
      ${proof.lovableLink && proof.githubLink && proof.deployedUrl ? `
        <div class="proof-section">
          <h2>Final Submission</h2>
          <div class="submission-preview">
            <div class="submission-preview__item">
              <strong>Lovable Project:</strong><br>
              <a href="${proof.lovableLink}" target="_blank">${proof.lovableLink}</a>
            </div>
            <div class="submission-preview__item">
              <strong>GitHub Repository:</strong><br>
              <a href="${proof.githubLink}" target="_blank">${proof.githubLink}</a>
            </div>
            <div class="submission-preview__item">
              <strong>Live Deployment:</strong><br>
              <a href="${proof.deployedUrl}" target="_blank">${proof.deployedUrl}</a>
            </div>
          </div>
          <button class="btn btn--primary" onclick="copyFinalSubmission()">Copy Final Submission</button>
        </div>
      ` : ''}
      
      ${!shipped && (proof.lovableLink || proof.githubLink || proof.deployedUrl || isAllTestsPassed()) ? `
        <div class="proof-requirements">
          <h3>Requirements to Ship:</h3>
          <ul>
            ${!isAllTestsPassed() ? '<li>Complete all 10 test checklist items</li>' : ''}
            ${!proof.lovableLink ? '<li>Provide Lovable Project Link</li>' : ''}
            ${!proof.githubLink ? '<li>Provide GitHub Repository Link</li>' : ''}
            ${!proof.deployedUrl ? '<li>Provide Deployed URL</li>' : ''}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

function getTestChecklist() {
  const checklist = localStorage.getItem('jobTrackerTestChecklist');
  return checklist ? JSON.parse(checklist) : {};
}

function setTestChecklist(checklist) {
  localStorage.setItem('jobTrackerTestChecklist', JSON.stringify(checklist));
}

function toggleTestItem(itemId) {
  const checklist = getTestChecklist();
  checklist[itemId] = !checklist[itemId];
  setTestChecklist(checklist);
  router();
}

function resetTestChecklist() {
  localStorage.removeItem('jobTrackerTestChecklist');
  router();
}

function isAllTestsPassed() {
  const checklist = getTestChecklist();
  const testItems = [
    'prefs-persist',
    'match-score',
    'match-toggle',
    'save-persist',
    'apply-tab',
    'status-persist',
    'status-filter',
    'digest-top10',
    'digest-persist',
    'no-errors'
  ];
  return testItems.every(item => checklist[item] === true);
}

function renderTestChecklist() {
  const checklist = getTestChecklist();
  
  const testItems = [
    {
      id: 'prefs-persist',
      label: 'Preferences persist after refresh',
      howTo: 'Set preferences in Settings, refresh page, verify they are still filled'
    },
    {
      id: 'match-score',
      label: 'Match score calculates correctly',
      howTo: 'Set preferences, check job cards show match % badges with correct colors'
    },
    {
      id: 'match-toggle',
      label: '"Show only matches" toggle works',
      howTo: 'Enable toggle on Dashboard, verify only jobs above threshold show'
    },
    {
      id: 'save-persist',
      label: 'Save job persists after refresh',
      howTo: 'Save a job, refresh page, go to Saved page, verify job is there'
    },
    {
      id: 'apply-tab',
      label: 'Apply opens in new tab',
      howTo: 'Click Apply button on any job, verify new tab opens with job URL'
    },
    {
      id: 'status-persist',
      label: 'Status update persists after refresh',
      howTo: 'Change job status to Applied, refresh page, verify status is still Applied'
    },
    {
      id: 'status-filter',
      label: 'Status filter works correctly',
      howTo: 'Set some jobs to Applied, filter by Applied status, verify only those show'
    },
    {
      id: 'digest-top10',
      label: 'Digest generates top 10 by score',
      howTo: 'Generate digest, verify it shows 10 jobs sorted by match score'
    },
    {
      id: 'digest-persist',
      label: 'Digest persists for the day',
      howTo: 'Generate digest, refresh page, go to Digest, verify same digest loads'
    },
    {
      id: 'no-errors',
      label: 'No console errors on main pages',
      howTo: 'Open DevTools Console, navigate all pages, verify no red errors'
    }
  ];
  
  const passedCount = testItems.filter(item => checklist[item.id]).length;
  const totalCount = testItems.length;
  const allPassed = passedCount === totalCount;
  
  return `
    <div class="page">
      <div class="page__header">
        <h1>Test Checklist</h1>
        <p class="page__subtitle">Verify all features before shipping</p>
      </div>
      
      <div class="test-summary">
        <div class="test-summary__score ${allPassed ? 'test-summary__score--pass' : ''}">
          Tests Passed: ${passedCount} / ${totalCount}
        </div>
        ${!allPassed ? `
          <div class="test-summary__warning">
            Resolve all issues before shipping.
          </div>
        ` : `
          <div class="test-summary__success">
            All tests passed! Ready to ship.
          </div>
        `}
      </div>
      
      <div class="test-checklist">
        ${testItems.map(item => `
          <div class="test-item ${checklist[item.id] ? 'test-item--checked' : ''}">
            <label class="test-item__label">
              <input 
                type="checkbox" 
                class="test-item__checkbox"
                ${checklist[item.id] ? 'checked' : ''}
                onchange="toggleTestItem('${item.id}')"
              >
              <span class="test-item__text">${item.label}</span>
            </label>
            <div class="test-item__tooltip" title="${item.howTo}">
              <span class="test-item__tooltip-icon">?</span>
              <div class="test-item__tooltip-content">${item.howTo}</div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="test-actions">
        <button class="btn btn--secondary" onclick="resetTestChecklist()">Reset Test Status</button>
        <a href="#/jt/08-ship" class="btn ${allPassed ? 'btn--primary' : 'btn--disabled'}" ${!allPassed ? 'onclick="return false;"' : ''}>Continue to Ship</a>
      </div>
    </div>
  `;
}

function renderShip() {
  if (!isAllTestsPassed()) {
    return `
      <div class="page">
        <div class="page__header">
          <h1>Ship</h1>
        </div>
        <div class="empty-state">
          <div class="empty-state__title">Tests Not Complete</div>
          <div class="empty-state__description">Complete all test checklist items before accessing this page.</div>
          <a href="#/jt/07-test" class="btn btn--primary">Go to Test Checklist</a>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="page">
      <div class="page__header">
        <h1>Ship</h1>
        <p class="page__subtitle">Ready for deployment</p>
      </div>
      <div class="ship-success">
        <div class="ship-success__icon">✓</div>
        <div class="ship-success__title">All Tests Passed</div>
        <div class="ship-success__description">Job Notification Tracker is ready to ship.</div>
      </div>
    </div>
  `;
}

function getSavedJobs() {
  const saved = localStorage.getItem('savedJobs');
  return saved ? JSON.parse(saved) : [];
}

function setSavedJobs(ids) {
  localStorage.setItem('savedJobs', JSON.stringify(ids));
}

function toggleSaveJob(jobId) {
  const saved = getSavedJobs();
  const index = saved.indexOf(jobId);
  
  if (index > -1) {
    saved.splice(index, 1);
  } else {
    saved.push(jobId);
  }
  
  setSavedJobs(saved);
  router();
}

function viewJob(jobId) {
  viewingJob = jobId;
  router();
}

function closeModal() {
  viewingJob = null;
  router();
}

function applyJob(url) {
  window.open(url, '_blank');
}

function updateFilter(key, value) {
  currentFilters[key] = value;
  router();
}

function toggleMatchFilter(checked) {
  showOnlyMatches = checked;
  router();
}

function generateDigest() {
  const prefs = getPreferences();
  if (!prefs) return;
  
  const jobsWithScores = jobsData.map(job => ({
    ...job,
    matchScore: calculateMatchScore(job)
  }));
  
  const topJobs = jobsWithScores
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.postedDaysAgo - b.postedDaysAgo;
    })
    .slice(0, 10);
  
  const today = new Date().toISOString().split('T')[0];
  const digestKey = `jobTrackerDigest_${today}`;
  
  const digest = {
    date: today,
    jobs: topJobs.map(j => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      experience: j.experience,
      matchScore: j.matchScore,
      applyUrl: j.applyUrl
    }))
  };
  
  localStorage.setItem(digestKey, JSON.stringify(digest));
  router();
}

function regenerateDigest() {
  const today = new Date().toISOString().split('T')[0];
  const digestKey = `jobTrackerDigest_${today}`;
  localStorage.removeItem(digestKey);
  generateDigest();
}

function copyDigestToClipboard() {
  const today = new Date().toISOString().split('T')[0];
  const digestKey = `jobTrackerDigest_${today}`;
  const digest = JSON.parse(localStorage.getItem(digestKey));
  
  if (!digest) return;
  
  const dateStr = new Date(digest.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let text = `TOP 10 JOBS FOR YOU — 9AM DIGEST\n${dateStr}\n\n`;
  
  digest.jobs.forEach((job, idx) => {
    text += `${idx + 1}. ${job.title}\n`;
    text += `   ${job.company}\n`;
    text += `   ${job.location} • ${job.experience} • ${job.matchScore}% match\n`;
    text += `   Apply: ${job.applyUrl}\n\n`;
  });
  
  text += `This digest was generated based on your preferences.`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Digest copied to clipboard!');
  });
}

function createEmailDraft() {
  const today = new Date().toISOString().split('T')[0];
  const digestKey = `jobTrackerDigest_${today}`;
  const digest = JSON.parse(localStorage.getItem(digestKey));
  
  if (!digest) return;
  
  const dateStr = new Date(digest.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let body = `TOP 10 JOBS FOR YOU — 9AM DIGEST%0D%0A${dateStr}%0D%0A%0D%0A`;
  
  digest.jobs.forEach((job, idx) => {
    body += `${idx + 1}. ${job.title}%0D%0A`;
    body += `   ${job.company}%0D%0A`;
    body += `   ${job.location} • ${job.experience} • ${job.matchScore}%25 match%0D%0A`;
    body += `   Apply: ${job.applyUrl}%0D%0A%0D%0A`;
  });
  
  body += `This digest was generated based on your preferences.`;
  
  const subject = 'My 9AM Job Digest';
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
}

function savePreferences(event) {
  event.preventDefault();
  
  const form = event.target;
  const roleKeywords = form.querySelector('#roleKeywords').value;
  const skills = form.querySelector('#skills').value;
  const experienceLevel = form.querySelector('#experienceLevel').value;
  const minMatchScore = parseInt(form.querySelector('#minMatchScore').value);
  
  const locationSelect = form.querySelector('#preferredLocations');
  const preferredLocations = Array.from(locationSelect.selectedOptions).map(opt => opt.value);
  
  const modeCheckboxes = form.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
  const preferredMode = Array.from(modeCheckboxes).map(cb => cb.value);
  
  const prefs = {
    roleKeywords,
    preferredLocations,
    preferredMode,
    experienceLevel,
    skills,
    minMatchScore
  };
  
  setPreferences(prefs);
  window.location.hash = '#/dashboard';
}

function router() {
  const hash = window.location.hash.slice(1) || '/dashboard';
  const route = routes[hash] || routes['/dashboard'];
  
  document.getElementById('routeContent').innerHTML = route.render();
  document.title = route.title;
  
  document.querySelectorAll('.nav__link').forEach(link => {
    link.classList.remove('active');
    const linkRoute = link.getAttribute('data-route');
    if (linkRoute === hash) {
      link.classList.add('active');
    }
  });
  
  document.getElementById('navList').classList.remove('is-open');
}

document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('navList').classList.toggle('is-open');
});

window.addEventListener('hashchange', router);

router();
