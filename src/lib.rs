use std::{borrow::Cow, convert::TryInto};

use wasm_bindgen::prelude::*;
use wordle_solver::{Correctness, Guess, Guesser, Solver};

fn parse_string(s: &String) -> Result<String, JsValue> {
    let s = s
        .trim()
        .chars()
        .filter(|v| !v.is_whitespace())
        .collect::<String>();

    if s.len() != 5 {
        Err(format!("{} isn't 5 letters long", s).into())
    } else {
        Ok(s)
    }
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn warn(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn help(guesses: Box<[String]>, masks: Box<[String]>, hard_mode: bool) -> Result<String, JsValue> {
    if guesses.len() != masks.len() {
        warn("List of guesses and masks don't have same size");
    } 
    if guesses.len() == 0 || masks.len() == 0 {
        return Ok("tares".to_string());
    }

    // Build the solver
    let mut solver = Solver::builder();
    solver.cache = false;
    solver.hard_mode = hard_mode;
    let mut guesser = solver.build();
    
    // Merge the two to make history
    let mut history = Vec::with_capacity(6);
    let mut next_guess = String::new();
    for (guess, mask) in guesses.into_iter().zip(masks.iter()) {
        let guess = parse_string(guess)?.to_ascii_lowercase();
        let mask: [Correctness; 5] = parse_string(mask)?
            .chars()
            .map(|c| match c.to_ascii_uppercase() {
                'C' => Ok(wordle_solver::Correctness::Correct),
                'M' => Ok(wordle_solver::Correctness::Misplaced),
                'W' => Ok(wordle_solver::Correctness::Wrong),
                _ => Err(format!(
                    "The guess color '{c}' wasn't recognized: use C/M/W"
                )),
            })
            .collect::<Result<Vec<_>, _>>()?
            .try_into()
            .expect("The parsed correctness is checked to be 5 items long".into());

        history.push(Guess {
            word: Cow::Owned(guess),
            mask,
        });

        next_guess = guesser.guess(&history);
    }
   
    Ok(next_guess)
}
