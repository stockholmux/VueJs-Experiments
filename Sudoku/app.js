let parseFullBoard = b => b.split('\n')
  .map(s => s.split(' '))
  .filter(s => s.length !== 1)
  .map(
    r => r.map(function(c) { return { num : c == '_' ? '' : Number(c) }})
  );

var router = new VueRouter({
    mode: 'history',
    routes: []
});

var createSocket = function(mid, changeCb) {
  let newSocket = new WebSocket(`ws://${window.location.hostname}/ws?mid=${mid}`);
  newSocket.onmessage = function (event) {
    console.log(event.data);
  }
  return 
}

var sudokuApp = new Vue({
    router, 

    el: '#app-sudoku',

    /*watch: {
      '$route.query.mid'(newVal, oldVal) {
        console.log('in watch');
        if (newVal != oldVal) {
          this.$router.push({query: { 'mid' : newVal}})
        }
      }
    },*/
    mounted: function() {
      this.mid = (this.$route.query && this.$route.query.mid) || '';
      if (this.mid) { console.log('mounted'); this.initializeGame(); }

    },

    data: {
        mid: '',
        sudokuMatrix: [],
        matrixString: '',
        evaluateGameText: "Verify!",
        answerImage: "",
        isGameStarted: false,
        showAnswer: false,
        p1: '',
        p2: '',
        socket : false,
        
    },

    methods: {
        socketInit() { 
          var
            that = this;

          if (this.socket !== false) {
            this.socket.close();
          } 
          this.socket = new WebSocket(`ws://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/ws?mid=${this.mid}`);
          this.socket.onmessage = function (event) {
            let current = that.sudokuMatrix.map(
              (row) => row.map((v) => v.num === '' ? '_' : v.num ).join(' ')+ '\n' 
            ).join('');
            
            let socketUpdate = JSON.parse(event.data);

            if (socketUpdate.Game.puzzle !== current) {
              console.log('update from socket');
              that.sudokuMatrix = parseFullBoard(socketUpdate.Game.puzzle); 
            }
            
          }
        },
        createGame(p1,p2) {
          this.sudokuMatrix = [];
          let req = new Request(`/create_match?p1=${p1}&p2=${p2}`);
          fetch(req) 
            .then(res => res.json())
            .then(body => { 
              this.mid = body.match_id;
              this.$router.replace({query: { 'mid' : body.match_id }});
              this.initializeGame();
              //router.push({ query: { mid: body.match_id }}) 
            });
        },
        changeMid(newMid) {
          this.$router.replace({query: { 'mid' : newMid}});
          this.initializeGame();
        },
        makeMove(number, row, column) {
          if (/^\d$/.exec(number)) {
            if (this.original[row][column].num === '') {
              let req = new Request(`/make_move?mid=${this.mid}&row=${row}&col=${column}&number=${Number(number)}`);
              fetch(req);
          
              
            } else {
              this.sudokuMatrix[row][column].num = this.original[row][column].num;
            }
          } else {
            this.sudokuMatrix[row][column].num = '';
          }          
        },
        initializeGame() {
            let that = this;
            let req = new Request(`/get_game?mid=${this.mid}`);
              fetch(req)
              .then(res => {
                return res.json();
              })
              .then(msg => {
                console.log(msg.Game);
                let puzzle = parseFullBoard(msg.Game.puzzle);
                that.original = parseFullBoard(msg.Game.original);
                that.sudokuMatrix = puzzle; 
                that.isGameStarted = true;

                this.socketInit();
              })
        },

        evaluateGame() {

            var copyOfSudokuMatrix = [];
            for (var i = 0; i < this.sudokuMatrix.length; ++i) {

                if (!copyOfSudokuMatrix[i])
                    copyOfSudokuMatrix[i] = [];

                for (var k = 0; k < this.sudokuMatrix[i].length; ++k) {
                    copyOfSudokuMatrix[i][k] = this.sudokuMatrix[i][k].num;
                }

            }

            var sudokuSolver = Sudoku.init(copyOfSudokuMatrix);

            if (sudokuSolver.isValid()) {

                this.answerImage = "success.gif";
                this.showAnswer = true;
                this.isGameStarted = false;

                setTimeout(() => {
                    this.showAnswer = false;
                    this.isGameStarted = true;
                }, 2000);

            }
            else {

                this.answerImage = "fail.gif";
                this.showAnswer = true;
                this.isGameStarted = false;

                setTimeout(() => {
                    this.showAnswer = false;
                    this.isGameStarted = true;
                }, 2000);

            }

        }

    }
});
