class SportsHub {
    constructor() {
        this.allEvents = [];
        this.filteredEvents = [];
        this.currentFilter = 'today';
        this.searchQuery = '';

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
        this.filterEvents('today');
    }

    bindEvents() {
        // Filter buttons
        document.getElementById('todayBtn').addEventListener('click', () => this.filterEvents('today'));
        document.getElementById('tomorrowBtn').addEventListener('click', () => this.filterEvents('tomorrow'));
        document.getElementById('weekBtn').addEventListener('click', () => this.filterEvents('week'));
        document.getElementById('allBtn').addEventListener('click', () => this.filterEvents('all'));

        // Search
        document.getElementById('search').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.applyFilters();
        });
    }

    async loadData() {
        try {
            // Load teams configuration
            const teamsResponse = await fetch('./data/teams.json');
            const teams = await teamsResponse.json();

            // For demo purposes, load sample events
            // In a real app, you'd fetch from sports APIs based on the teams
            const eventsResponse = await fetch('./data/sample-events.json');
            const sampleEvents = await eventsResponse.json();

            // In production, you'd call APIs like:
            // this.allEvents = await this.fetchEventsFromAPIs(teams);
            this.allEvents = sampleEvents;

            // Sort events by date
            this.allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load events data');
        }
    }

    // This is where you'd integrate with real sports APIs
    async fetchEventsFromAPIs(teams) {
        const events = [];

        // Example API integration (you'd implement these)
        for (const team of teams) {
            try {
                switch (team.type) {
                    case 'mlb':
                        // events.push(...await this.fetchMLBGames(team));
                        break;
                    case 'nba':
                        // events.push(...await this.fetchNBAGames(team));
                        break;
                    case 'nhl':
                        // events.push(...await this.fetchNHLGames(team));
                        break;
                    case 'nfl':
                        // events.push(...await this.fetchNFLGames(team));
                        break;
                    case 'mma':
                        // events.push(...await this.fetchMMAEvents(team));
                        break;
                }
            } catch (error) {
                console.error(`Error fetching ${team.type} events:`, error);
            }
        }

        return events;
    }

    filterEvents(timeframe) {
        this.currentFilter = timeframe;

        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${timeframe}Btn`).classList.add('active');

        this.applyFilters();
    }

    applyFilters() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
        const endOfTomorrow = new Date(startOfTomorrow);
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
        const endOfWeek = new Date(startOfToday);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        let filtered = this.allEvents.filter(event => {
            const eventDate = new Date(event.start);

            // Time filter
            switch (this.currentFilter) {
                case 'today':
                    if (eventDate < startOfToday || eventDate >= startOfTomorrow) return false;
                    break;
                case 'tomorrow':
                    if (eventDate < startOfTomorrow || eventDate >= endOfTomorrow) return false;
                    break;
                case 'week':
                    if (eventDate < startOfToday || eventDate >= endOfWeek) return false;
                    break;
                case 'all':
                    // Show all future events
                    if (eventDate < startOfToday) return false;
                    break;
            }

            // Search filter
            if (this.searchQuery) {
                const searchFields = [
                    event.teamA, event.teamB, event.fighterA, event.fighterB,
                    event.league, event.promotion, event.sport
                ].filter(Boolean).join(' ').toLowerCase();

                if (!searchFields.includes(this.searchQuery)) return false;
            }

            return true;
        });

        this.filteredEvents = filtered;
        this.renderEvents();
    }

    renderEvents() {
        const loadingEl = document.getElementById('loading');
        const eventsListEl = document.getElementById('eventsList');
        const noEventsEl = document.getElementById('noEvents');

        loadingEl.style.display = 'none';

        if (this.filteredEvents.length === 0) {
            eventsListEl.innerHTML = '';
            noEventsEl.style.display = 'block';
            return;
        }

        noEventsEl.style.display = 'none';
        eventsListEl.innerHTML = this.filteredEvents.map(event => this.createEventCard(event)).join('');
    }

    createEventCard(event) {
        const eventDate = new Date(event.start);
        const isToday = this.isToday(eventDate);
        const isTomorrow = this.isTomorrow(eventDate);

        let dateLabel = '';
        if (isToday) {
            dateLabel = 'Today';
        } else if (isTomorrow) {
            dateLabel = 'Tomorrow';
        } else {
            dateLabel = eventDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        }

        const timeString = eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const matchup = event.teamA && event.teamB 
            ? `${event.teamA} <span class="vs">vs</span> ${event.teamB}`
            : `${event.fighterA} <span class="vs">vs</span> ${event.fighterB}`;

        const league = event.league || event.promotion;
        const statusClass = event.status === 'live' ? 'status-live' : 'status-scheduled';

        return `
            <div class="event-card">
                <div class="event-header">
                    <span class="event-league">${league}</span>
                    <span class="event-status ${statusClass}">${event.status}</span>
                </div>
                <div class="event-matchup">${matchup}</div>
                <div class="event-time">
                    <span class="time-icon">🕐</span>
                    <span>${dateLabel} at ${timeString}</span>
                </div>
            </div>
        `;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isTomorrow(date) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date.toDateString() === tomorrow.toDateString();
    }

    showError(message) {
        const eventsListEl = document.getElementById('eventsList');
        const loadingEl = document.getElementById('loading');

        loadingEl.style.display = 'none';
        eventsListEl.innerHTML = `
            <div class="event-card" style="text-align: center; color: #f44336;">
                <p>⚠️ ${message}</p>
                <p style="font-size: 14px; margin-top: 8px; opacity: 0.8;">
                    Please check your connection and try again.
                </p>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SportsHub();
});

// Add some utility functions for future API integrations
const APIHelpers = {
    // Example function for MLB API integration
    async fetchMLBGames(team) {
        // Example using MLB Stats API (free)
        // const response = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${team.id}&startDate=${today}&endDate=${nextWeek}`);
        // return this.normalizeMLBData(await response.json());
        return [];
    },

    // Example function for NBA API integration  
    async fetchNBAGames(team) {
        // Example using balldontlie API (free tier available)
        // const response = await fetch(`https://www.balldontlie.io/api/v1/games?team_ids[]=${team.id}&start_date=${today}&end_date=${nextWeek}`);
        // return this.normalizeNBAData(await response.json());
        return [];
    },

    // Normalize different API responses to common format
    normalizeMLBData(data) {
        // Convert MLB API response to our event format
        return data.dates?.flatMap(date => 
            date.games?.map(game => ({
                id: `mlb_${game.gamePk}`,
                sport: 'Baseball',
                league: 'MLB',
                teamA: game.teams.away.team.name,
                teamB: game.teams.home.team.name,
                start: game.gameDate,
                status: game.status.detailedState === 'In Progress' ? 'live' : 'Scheduled'
            }))
        ) || [];
    },

    normalizeNBAData(data) {
        // Convert NBA API response to our event format
        return data.data?.map(game => ({
            id: `nba_${game.id}`,
            sport: 'Basketball', 
            league: 'NBA',
            teamA: game.visitor_team.full_name,
            teamB: game.home_team.full_name,
            start: game.date,
            status: game.status === 'Final' ? 'Completed' : 'Scheduled'
        })) || [];
    }
};