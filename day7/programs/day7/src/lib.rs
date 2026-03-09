use anchor_lang::prelude::*;

declare_id!("AsrxpNDYTBj8xS6ddT46CTBNwZoUSmTxct9muQSfYPjv");

#[derive(Debug)]
struct MyValues<T> {
    foo: T,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
struct Person {
    name: String,
    age: u64,
}

#[program]
pub mod day7 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let s1 = String::from("abc");
        let s2 = &s1;
        msg!("s1 = {}", s1);
        msg!("s2 = {}", s2);

        let mut message = String::from("hello");
        msg!("{}", message);
        let mut y = message.clone();
        message = message + " world";
        msg!("{}", message);
        msg!("{}", y);

        let mut counter = 0;
        counter = counter + 1;
        msg!("{}", counter);

        let first_struct: MyValues<i32> = MyValues { foo: 1 };
        let second_struct: MyValues<bool> = MyValues { foo: false };
        msg!("first_struct {:?}", first_struct);
        msg!("second_struct {:?}", second_struct);

        let v = Vec::from([1, 2, 3, 4, 5]);
        assert!(*v.iter().max().unwrap() == 5);

        let init_person: Person = Person {
            name: "Alice".to_string(),
            age: 27,
        };

        // Encode the `init_person` struct into a byte vector
        let encoded_data: Vec<u8> = init_person.try_to_vec().unwrap();

        // Decode the encoded data back into a `Person` struct
        let data: Person = decode(encoded_data)?;

        // Logs the decoded person's name and age
        msg!("My name is {:?}, I am {:?} years old.", data.name, data.age);

        Ok(())
    }
}

pub fn decode(encoded_data: Vec<u8>) -> Result<Person> {
    // Decode the encoded data back into a `Person` struct
    let decoded_data: Person = Person::try_from_slice(&encoded_data).unwrap();
    Ok(decoded_data)
}

#[derive(Accounts)]
pub struct Initialize {}
