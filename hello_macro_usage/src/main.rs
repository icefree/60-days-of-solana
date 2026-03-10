use hello_macro::HelloMacro;

#[derive(HelloMacro)]
struct Pancakes;

#[derive(HelloMacro)]
struct SunnysideUp;

fn main() {
    println!("--- Testing HelloMacro Derive ---");
    Pancakes::hello_macro();
    SunnysideUp::hello_macro();
}
