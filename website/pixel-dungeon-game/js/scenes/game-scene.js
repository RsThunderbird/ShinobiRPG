define(['util/observer', 'asset-loader', 'gui/button', 'scenes/arcs'], function (Observer, AssetLoader, Button, Arcs) {
    var GameScene = Observer.extend({
        init: function (options) {
            this.game = options.game;
            this.zoom = options.zoom;
            this.height = options.height;
            this.width = options.width;
            this.context = options.context;
            this.heroClass = options.heroClass || localStorage.getItem('LAST_CLASS') || 'WARRIOR';

            this.started = false;
            this.ready = false;

            // Game state
            this.level = 1;
            this.gold = 0;
            this.experience = 0;
            this.health = 20;
            this.maxHealth = 20;

            // Dungeon dimensions
            this.dungeonWidth = 32;
            this.dungeonHeight = 32;
            this.tileSize = 16;

            // Camera
            this.cameraX = 0;
            this.cameraY = 0;

            // Hero position (in tile coordinates)
            this.heroX = 0;
            this.heroY = 0;

            // Keyboard state
            this.keys = {};

            this.aLoader = new AssetLoader(this.game.config.assetConfig);
            this.aLoader.addSprite("avatars", "png");
            this.aLoader.addSprite("dashboard", "png");
            this.aLoader.addSprite("hp_bar", "png");
            this.aLoader.addSprite("exp_bar", "png");

            this.aLoader.load(this.onResourcesLoaded.bind(this));

            this.children = [];

            // Attach keyboard events
            this.attachKeyboardEvents();
        },

        attachKeyboardEvents: function () {
            window.addEventListener('keydown', (function (e) {
                this.keys[e.key] = true;
                this.handleKeyPress(e.key);
            }).bind(this));

            window.addEventListener('keyup', (function (e) {
                this.keys[e.key] = false;
            }).bind(this));
        },

        handleKeyPress: function (key) {
            if (!this.ready) return;

            var newX = this.heroX;
            var newY = this.heroY;

            switch (key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    newY--;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    newY++;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    newX--;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    newX++;
                    break;
            }

            // Check if new position is walkable
            if (this.isWalkable(newX, newY)) {
                this.heroX = newX;
                this.heroY = newY;
                this.updateCamera();
            }
        },

        isWalkable: function (x, y) {
            if (x < 0 || x >= this.dungeonWidth || y < 0 || y >= this.dungeonHeight) {
                return false;
            }
            var tile = this.dungeon[y][x];
            return tile === 0 || tile === 2; // floor or door
        },

        generateDungeon: function () {
            // Initialize with walls
            this.dungeon = [];
            for (var y = 0; y < this.dungeonHeight; y++) {
                this.dungeon[y] = [];
                for (var x = 0; x < this.dungeonWidth; x++) {
                    this.dungeon[y][x] = 1; // wall
                }
            }

            // Create rooms
            var rooms = [];
            var numRooms = 8 + Math.floor(Math.random() * 4);

            for (var i = 0; i < numRooms; i++) {
                var roomWidth = 4 + Math.floor(Math.random() * 6);
                var roomHeight = 4 + Math.floor(Math.random() * 6);
                var roomX = 1 + Math.floor(Math.random() * (this.dungeonWidth - roomWidth - 2));
                var roomY = 1 + Math.floor(Math.random() * (this.dungeonHeight - roomHeight - 2));

                var overlaps = false;
                for (var j = 0; j < rooms.length; j++) {
                    if (this.roomsOverlap(
                        roomX, roomY, roomWidth, roomHeight,
                        rooms[j].x, rooms[j].y, rooms[j].w, rooms[j].h
                    )) {
                        overlaps = true;
                        break;
                    }
                }

                if (!overlaps) {
                    rooms.push({ x: roomX, y: roomY, w: roomWidth, h: roomHeight });
                    this.carveRoom(roomX, roomY, roomWidth, roomHeight);
                }
            }

            // Connect rooms with corridors
            for (var i = 0; i < rooms.length - 1; i++) {
                this.connectRooms(rooms[i], rooms[i + 1]);
            }

            // Place hero in first room
            if (rooms.length > 0) {
                this.heroX = rooms[0].x + Math.floor(rooms[0].w / 2);
                this.heroY = rooms[0].y + Math.floor(rooms[0].h / 2);
            }

            this.updateCamera();
        },

        roomsOverlap: function (x1, y1, w1, h1, x2, y2, w2, h2) {
            return !(x1 + w1 + 1 < x2 || x2 + w2 + 1 < x1 || y1 + h1 + 1 < y2 || y2 + h2 + 1 < y1);
        },

        carveRoom: function (x, y, w, h) {
            for (var dy = 0; dy < h; dy++) {
                for (var dx = 0; dx < w; dx++) {
                    this.dungeon[y + dy][x + dx] = 0; // floor
                }
            }
        },

        connectRooms: function (room1, room2) {
            var x1 = room1.x + Math.floor(room1.w / 2);
            var y1 = room1.y + Math.floor(room1.h / 2);
            var x2 = room2.x + Math.floor(room2.w / 2);
            var y2 = room2.y + Math.floor(room2.h / 2);

            // Horizontal corridor
            var startX = Math.min(x1, x2);
            var endX = Math.max(x1, x2);
            for (var x = startX; x <= endX; x++) {
                this.dungeon[y1][x] = 0;
            }

            // Vertical corridor
            var startY = Math.min(y1, y2);
            var endY = Math.max(y1, y2);
            for (var y = startY; y <= endY; y++) {
                this.dungeon[y][x2] = 0;
            }
        },

        updateCamera: function () {
            var viewWidth = Math.floor(this.width / (this.tileSize * this.zoom));
            var viewHeight = Math.floor((this.height - 24 * this.zoom) / (this.tileSize * this.zoom));

            this.cameraX = this.heroX - Math.floor(viewWidth / 2);
            this.cameraY = this.heroY - Math.floor(viewHeight / 2);

            this.cameraX = Math.max(0, Math.min(this.cameraX, this.dungeonWidth - viewWidth));
            this.cameraY = Math.max(0, Math.min(this.cameraY, this.dungeonHeight - viewHeight));
        },

        initScene: function () {
            this.generateDungeon();
        },

        onResourcesLoaded: function () {
            this.initScene();
            this.ready = true;
            this.start();
        },

        step: function () {
            this.context.clearRect(0, 0, this.width, this.height);
            this.update();
            this.draw();
            if (this.started) {
                requestAnimationFrame(this.step.bind(this), null);
            }
        },

        changeScene: function (sceneName) {
            this.game.changeScene({
                sceneName: sceneName
            });
        },

        start: function () {
            this.started = true;
            this.step();
        },

        stop: function () {
            this.started = false;
        },

        update: function () {
            this.children.forEach((function (element) {
                element.update && element.update();
            }).bind(this));
        },

        onMouseDown: function (x, y, mouseEvent) {
            var hit = this.hitTest(x, y);
            if (hit && hit.onMouseDown) {
                this.mouseDownEvent = mouseEvent;
                mouseEvent.hit = hit;
                hit.onMouseDown(x, y, mouseEvent);
            }
        },

        onMouseUp: function (x, y, mouseEvent) {
            var hit = this.hitTest(x, y);
            this.children.forEach((function (el) {
                if (el.onMouseUp) {
                    el.onMouseUp(x, y, mouseEvent);
                }
            }).bind(this));
            if (hit) {
                if (this.mouseDownEvent && this.mouseDownEvent.hit == hit && hit.press) {
                    hit.press();
                }
            }
            this.mouseDownEvent = null;
        },

        hitTest: function (x, y) {
            for (var i = this.children.length - 1; i >= 0; i--) {
                if (this.children[i].hitTest) {
                    var res = this.children[i].hitTest(x, y);
                    if (res === true) return this.children[i];
                }
            }
            return null;
        },

        draw: function () {
            if (!this.ready) return;

            this.context.save();

            // Draw dungeon
            this.drawDungeon();

            // Draw hero
            this.drawHero();

            // Draw UI
            this.drawUI();

            this.context.restore();
        },

        drawDungeon: function () {
            var viewWidth = Math.ceil(this.width / (this.tileSize * this.zoom)) + 1;
            var viewHeight = Math.ceil((this.height - 24 * this.zoom) / (this.tileSize * this.zoom)) + 1;

            for (var y = 0; y < viewHeight; y++) {
                for (var x = 0; x < viewWidth; x++) {
                    var tileX = this.cameraX + x;
                    var tileY = this.cameraY + y;

                    if (tileX >= 0 && tileX < this.dungeonWidth && tileY >= 0 && tileY < this.dungeonHeight) {
                        var tile = this.dungeon[tileY][tileX];

                        // Draw using canvas rectangles instead of sprites
                        var drawX = x * this.tileSize * this.zoom;
                        var drawY = y * this.tileSize * this.zoom;
                        var size = this.tileSize * this.zoom;

                        if (tile === 0) {
                            // Floor - light gray
                            this.context.fillStyle = '#4a4a4a';
                            this.context.fillRect(drawX, drawY, size, size);

                            // Add subtle grid pattern
                            this.context.strokeStyle = '#3a3a3a';
                            this.context.lineWidth = 1;
                            this.context.strokeRect(drawX, drawY, size, size);
                        } else {
                            // Wall - dark gray with border
                            this.context.fillStyle = '#2a2a2a';
                            this.context.fillRect(drawX, drawY, size, size);

                            this.context.strokeStyle = '#1a1a1a';
                            this.context.lineWidth = 1;
                            this.context.strokeRect(drawX, drawY, size, size);
                        }
                    }
                }
            }
        },

        drawHero: function () {
            var avatarsImg = this.aLoader.spriteData('avatars').image;
            var heroSrcX = 0;

            // Select sprite based on hero class
            switch (this.heroClass) {
                case 'WARRIOR':
                    heroSrcX = 0;
                    break;
                case 'MAGE':
                    heroSrcX = 24;
                    break;
                case 'ROGUE':
                    heroSrcX = 48;
                    break;
                case 'HUNTRESS':
                    heroSrcX = 72;
                    break;
            }

            var screenX = (this.heroX - this.cameraX) * this.tileSize * this.zoom;
            var screenY = (this.heroY - this.cameraY) * this.tileSize * this.zoom;

            this.context.drawImage(
                avatarsImg,
                heroSrcX, 0, 24, 32,
                screenX - 4 * this.zoom,
                screenY - 8 * this.zoom,
                24 * this.zoom,
                32 * this.zoom
            );
        },

        drawUI: function () {
            var dashboardImg = this.aLoader.spriteData('dashboard').image;
            var hpBarImg = this.aLoader.spriteData('hp_bar').image;
            var expBarImg = this.aLoader.spriteData('exp_bar').image;

            var uiY = this.height - 24 * this.zoom;

            // Draw dashboard background
            this.context.drawImage(
                dashboardImg,
                0, 0, 128, 24,
                0, uiY,
                this.width, 24 * this.zoom
            );

            // Draw HP bar
            var hpWidth = Math.floor((this.health / this.maxHealth) * 40);
            if (hpWidth > 0) {
                this.context.drawImage(
                    hpBarImg,
                    0, 0, hpWidth, 1,
                    10 * this.zoom, uiY + 10 * this.zoom,
                    hpWidth * this.zoom, 2 * this.zoom
                );
            }

            // Draw text
            this.context.fillStyle = '#FFFFFF';
            this.context.font = (8 * this.zoom) + 'px monospace';
            this.context.fillText('HP: ' + this.health + '/' + this.maxHealth, 10 * this.zoom, uiY + 8 * this.zoom);
            this.context.fillText('Gold: ' + this.gold, 80 * this.zoom, uiY + 8 * this.zoom);
            this.context.fillText('Depth: ' + this.level, 10 * this.zoom, uiY + 20 * this.zoom);
            this.context.fillText('Use Arrow Keys or WASD to move', 80 * this.zoom, uiY + 20 * this.zoom);
        }

    });

    return GameScene;
})