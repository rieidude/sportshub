class SportsHub {
    constructor() {
        this.allEvents = [];
        this.filteredEvents = [];
        this.currentFilter = 'today';
        this.currentSportFilter = 'all';
        this.searchQuery = '';

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
        this.populateSportFilter();
        this.filterEvents('today');
    }

    bindEvents() {
        // Filter buttons
        document.getElementById('todayBtn').addEventListener('click', () => this.filterEvents('today'));
        document.getElementById('tomorrowBtn').addEventListener('click', () => this.filterEvents('tomorrow'));
        document.getElementById('weekBtn').addEventListener('click', () => this.filterEvents('week'));
        document.getElementById('allBtn').addEventListener('click', () => this.filterEvents('all'));

        // Sport filter dropdown
        document.getElementById('sportFilter').addEventListener('change', (e) => {
            this.currentSportFilter = e.target.value;
            this.applyFilters();
        });

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

            // Fetch real events from APIs
            console.log('Fetching real sports data...');
            this.allEvents = await this.fetchEventsFromAPIs(teams);

            // Fallback to sample data if API fails
            if (this.allEvents.length === 0) {
                console.log('No API data found, loading sample events...');
                const eventsResponse = await fetch('./data/sample-events.json');
                const sampleEvents = await eventsResponse.json();
                this.allEvents = sampleEvents;
            }

            // Sort events by date
            this.allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load events data');
        }
    }

    // Fetch real sports data from APIs
    async fetchEventsFromAPIs(teams) {
        const events = [];

        // Get date range for API calls
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const startDate = today.toISOString().split('T')[0];
        const endDate = nextMonth.toISOString().split('T')[0];

        // Group teams by sport to minimize API calls
        const mlbTeams = teams.filter(t => t.type === 'mlb');
        const nbaTeams = teams.filter(t => t.type === 'nba');
        const nhlTeams = teams.filter(t => t.type === 'nhl');
        const nflTeams = teams.filter(t => t.type === 'nfl');

        try {
            // Fetch MLB games (all games, then filter for your teams)
            if (mlbTeams.length > 0) {
                console.log('Fetching MLB games...');
                const mlbGames = await this.fetchMLBGames(startDate, endDate);
                const filteredMLBGames = this.filterGamesForTeams(mlbGames, mlbTeams);
                events.push(...filteredMLBGames);
            }

            // Add other sports here later
            // if (nbaTeams.length > 0) {
            //     const nbaGames = await this.fetchNBAGames(startDate, endDate);
            //     events.push(...this.filterGamesForTeams(nbaGames, nbaTeams));
            // }

        } catch (error) {
            console.error('Error fetching API data:', error);
        }

        return events;
    }

    // Populate sport filter dropdown with available sports
    populateSportFilter() {
        const sportFilter = document.getElementById('sportFilter');
        if (!sportFilter) return;

        // Get unique sports from all events
        const sports = [...new Set(this.allEvents.map(event => event.sport))].sort();
        
        // Clear existing options except "All Sports"
        sportFilter.innerHTML = '<option value="all">All Sports</option>';
        
        // Add sport options
        sports.forEach(sport => {
            if (sport) {
                const option = document.createElement('option');
                option.value = sport.toLowerCase();
                option.textContent = sport;
                sportFilter.appendChild(option);
            }
        });
    }

    // Fetch MLB games from the official MLB Stats API
    async fetchMLBGames(startDate, endDate) {
        try {
            const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDate}&endDate=${endDate}`;
            console.log('MLB API URL:', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`MLB API error: ${response.status}`);
            }

            const data = await response.json();
            return this.normalizeMLBData(data);
        } catch (error) {
            console.error('Error fetching MLB games:', error);
            return [];
        }
    }

    // Filter games to only include your favorite teams
    filterGamesForTeams(games, teams) {
        const teamNames = teams.map(t => t.team.toLowerCase());
        return games.filter(game => {
            const teamA = game.teamA.toLowerCase();
            const teamB = game.teamB.toLowerCase();
            return teamNames.some(name => teamA.includes(name) || teamB.includes(name));
        });
    }

    // Convert MLB API response to our standard format
    normalizeMLBData(data) {
        const games = [];

        if (data.dates) {
            for (const date of data.dates) {
                if (date.games) {
                    for (const game of date.games) {
                        games.push({
                            id: `mlb_${game.gamePk}`,
                            sport: 'Baseball',
                            league: 'MLB',
                            teamA: game.teams.away.team.name,
                            teamB: game.teams.home.team.name,
                            start: game.gameDate,
                            status: this.getMLBGameStatus(game.status),
                            venue: game.venue?.name || 'TBD'
                        });
                    }
                }
            }
        }

        return games;
    }

    // Convert MLB status to our standard format
    getMLBGameStatus(status) {
        const state = status.detailedState || status.statusCode;
        const abstractState = status.abstractGameState;

        // Check abstract state first for broader categories
        if (abstractState === 'Live') return 'Live';
        if (abstractState === 'Final') return 'Final';
        
        // Then check detailed states
        if (state === 'In Progress' || state === 'I') return 'Live';
        if (state === 'Final' || state === 'F') return 'Final';
        if (state === 'Postponed' || state === 'P') return 'Postponed';
        if (state === 'Cancelled' || state === 'C') return 'Cancelled';
        if (state === 'Delayed' || state === 'D') return 'Delayed';

        return 'Scheduled';
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
        const statusClass = event.status === 'Live' ? 'status-live' : 'status-scheduled';

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
