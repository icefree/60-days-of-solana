use anchor_lang::prelude::*;

declare_id!("2fYu4xeA6v4W9nuW9tetjzefcF1hkL3Zb5Ta68GPiBHW");

const MEANING_OF_LIFE_AND_EXISTENCE: u64 = 42;

#[program]
pub mod day6 {
    use super::*;
    use std::collections::HashMap;

    pub fn age_checker(
        ctx: Context<Initialize>,
        age: u64,
        key: String,
        value: String,
    ) -> Result<()> {
        let result = if age >= 18 {
            "You are eligible for voting"
        } else {
            "You are not eligible for voting"
        };
        msg!("{:?}", result);

        match age {
            1 => {
                msg!("You are 1 year old");
            }
            2 | 3 => {
                msg!("You are 2 or 3 years old");
            }
            4..=6 => {
                msg!("You are between 4 and 6 years old");
            }
            _ => {
                msg!("You are {} years old", age);
            }
        }
        for i in (0..10).step_by(2) {
            msg!("loop {}", i);
        }

        let my_array: [u32; 5] = [10, 20, 30, 40, 50];
        msg!("array[0] = {}", my_array[0]);
        msg!("array[2] = {}", my_array[2]);
        msg!("array[4] = {}", my_array[4]);

        let mut mutable_array: [u32; 5] = [100, 200, 300, 400, 500];
        mutable_array[1] = 100;
        msg!("mutable_array {:?}", mutable_array);

        let mut dynamic_array: Vec<u32> = Vec::new();
        dynamic_array.push(10);
        dynamic_array.push(20);
        dynamic_array.push(30);
        msg!("dynamic_array {:?}", dynamic_array);

        msg!("third element = {}", dynamic_array[2]);

        let mut my_map = HashMap::new();
        my_map.insert(key.as_str(), value.as_str());

        msg!("my_map {:?}", my_map);
        msg!("My name is {}", my_map.get(key.as_str()).unwrap());

        struct Person {
            my_name: String,
            my_age: u64,
        }

        let mut person1: Person = Person {
            my_name: value,
            my_age: age,
        };

        msg!("{} is {} years old", person1.my_name, person1.my_age);

        person1.my_name = "Bob".to_string();
        person1.my_age = 33;

        msg!("{} is {} years old", person1.my_name, person1.my_age);

        msg!(
            "Answer to the ultimate question: {}",
            MEANING_OF_LIFE_AND_EXISTENCE
        );

        let mut dynamic_array: Vec<u32> = Vec::from([1, 2, 3, 4, 5, 6]);
        let len = dynamic_array.len();
        let another_var: u64 = 5;
        let len_plus_another_var = len + another_var;
        msg!("The result is {}", len_plus_another_var);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
